import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Client } from "@upstash/qstash";
import { getAppUrl } from "../../../lib/app-url";
import {
  getTriggerUnavailableReason,
  isTriggerReady,
} from "../../../lib/trigger-catalog";

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

// Middleware helper to verify auth
function getUserIdFromToken(req: NextRequest): number | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(
      auth.slice(7),
      process.env.JWT_SECRET || "secret"
    ) as { id: number };
    return decoded.id;
  } catch {
    return null;
  }
}

// GET /api/zap - List user's zaps
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const zaps = await prismaClient.zap.findMany({
      where: { userId },
      include: {
        trigger: { include: { type: true } },
        actions: { include: { type: true }, orderBy: { sortingOrder: "asc" } },
        _count: { select: { ZapRuns: true } },
      },
    });
    return NextResponse.json({ success: true, zaps });
  } catch (error) {
    console.error("Get zaps error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/zap - Create a zap
// QStash schedule creation is OUTSIDE the DB transaction so slow networks
// cannot expire the interactive transaction (P2028).
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { triggerId, triggerMetadata, actions, maxRuns, name, description } =
    await req.json();

  if (!triggerId || !Array.isArray(actions) || actions.length === 0) {
    return NextResponse.json(
      { error: "triggerId and at least one action required" },
      { status: 400 }
    );
  }

  try {
    const triggerType = await prismaClient.availableTriggers.findUnique({
      where: { id: triggerId },
    });

    if (!triggerType) {
      return NextResponse.json({ error: "Unknown trigger" }, { status: 400 });
    }

    if (!isTriggerReady(triggerType.name)) {
      return NextResponse.json(
        {
          error: getTriggerUnavailableReason(triggerType.name),
          code: "TRIGGER_NOT_READY",
          trigger: triggerType.name,
        },
        { status: 400 }
      );
    }

    // 1) Persist zap + actions + trigger only (no external HTTP)
    const basePayload =
      triggerMetadata && typeof triggerMetadata === "object"
        ? { ...triggerMetadata }
        : {};

    if (triggerType.name === "RSS Feed") {
      basePayload.pollCron =
        (triggerMetadata?.pollCron as string) ||
        (triggerMetadata?.cronExpression as string) ||
        "*/30 * * * *";
      basePayload.feedUrl = (triggerMetadata?.feedUrl as string) || "";
    }

    const created = await prismaClient.$transaction(
      async (tx) => {
        const zap = await tx.zap.create({
          data: {
            userId,
            triggerId: "",
            name: name || null,
            description: description || null,
            maxRuns: maxRuns ?? -1,
            actions: {
              create: actions.map(
                (
                  a: { availableActionId: string; actionMetadata: object },
                  i: number
                ) => ({
                  actionId: a.availableActionId,
                  sortingOrder: i,
                  metadata: a.actionMetadata || {},
                })
              ),
            },
          },
        });

        const trigger = await tx.trigger.create({
          data: {
            zapId: zap.id,
            availableTriggersId: triggerId,
            payload: basePayload,
          },
        });

        return tx.zap.update({
          where: { id: zap.id },
          data: { triggerId: trigger.id },
          include: {
            trigger: { include: { type: true } },
            actions: { include: { type: true }, orderBy: { sortingOrder: "asc" } },
          },
        });
      },
      { maxWait: 10_000, timeout: 20_000 }
    );

    // 2) Optional QStash schedules after commit
    // Schedules must hit a publicly reachable URL (APP_URL on deploy).
    // Locally QStash cannot call localhost — schedule creation may fail gracefully.
    const appUrl =
      process.env.APP_URL?.replace(/\/$/, "") || getAppUrl();
    let schedulePatch: Record<string, unknown> | null = null;

    if (triggerType.name === "Schedule (Cron)") {
      const cronExpression =
        (triggerMetadata?.cronExpression as string) || "*/30 * * * *";
      console.log(`⏰ Creating QStash schedule for zap ${created.id}`);
      console.log(`   Cron: ${cronExpression}`);
      console.log(`   Callback: ${appUrl}/api/cron/${created.id}`);

      try {
        const schedule = await qstash.schedules.create({
          destination: `${appUrl}/api/cron/${created.id}`,
          cron: cronExpression,
        });
        schedulePatch = {
          ...basePayload,
          scheduleId: schedule.scheduleId,
        };
        console.log(`   ✅ Schedule created: ${schedule.scheduleId}`);
      } catch (scheduleError) {
        console.error(`   ❌ Failed to create schedule:`, scheduleError);
        schedulePatch = {
          ...basePayload,
          scheduleError: "Failed to create QStash schedule",
        };
      }
    }

    if (triggerType.name === "RSS Feed") {
      const pollCron =
        (basePayload.pollCron as string) || "*/30 * * * *";
      const feedUrl = (basePayload.feedUrl as string) || "";
      console.log(`📰 Creating RSS poll schedule for zap ${created.id}`);
      console.log(`   Feed: ${feedUrl}`);
      console.log(`   Cron: ${pollCron}`);
      console.log(`   Callback: ${appUrl}/api/poll/rss/${created.id}`);

      try {
        const schedule = await qstash.schedules.create({
          destination: `${appUrl}/api/poll/rss/${created.id}`,
          cron: pollCron,
        });
        schedulePatch = {
          ...basePayload,
          feedUrl,
          pollCron,
          scheduleId: schedule.scheduleId,
        };
        console.log(`   ✅ RSS schedule created: ${schedule.scheduleId}`);
      } catch (scheduleError) {
        console.error(`   ❌ Failed to create RSS schedule:`, scheduleError);
        schedulePatch = {
          ...basePayload,
          feedUrl,
          pollCron,
          scheduleError: "Failed to create QStash schedule for RSS",
        };
      }
    }

    if (schedulePatch && created.trigger) {
      await prismaClient.trigger.update({
        where: { id: created.trigger.id },
        data: { payload: schedulePatch as object },
      });
      created.trigger.payload = schedulePatch as object;
    }

    return NextResponse.json({ zap: created });
  } catch (error) {
    console.error("Create zap error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
