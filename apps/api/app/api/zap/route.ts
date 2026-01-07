import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Client } from "@upstash/qstash";

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

// Middleware helper to verify auth
function getUserIdFromToken(req: NextRequest): number | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || "secret") as { id: number };
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
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { triggerId, triggerMetadata, actions, maxRuns, name, description } = await req.json();

  try {
    // Get the trigger type to check if it's a schedule
    const triggerType = await prismaClient.availableTriggers.findUnique({
      where: { id: triggerId },
    });

    const result = await prismaClient.$transaction(async (tx) => {
      const zap = await tx.zap.create({
        data: {
          userId,
          triggerId: "",
          name: name || null,
          description: description || null,
          maxRuns: maxRuns ?? -1, // Default to forever
          actions: {
            create: actions.map((a: { availableActionId: string; actionMetadata: object }, i: number) => ({
              actionId: a.availableActionId,
              sortingOrder: i,
              metadata: a.actionMetadata || {},
            })),
          },
        },
      });

      // Build trigger payload
      let triggerPayload = triggerMetadata || {};

      // If this is a Schedule trigger, create QStash schedule
      if (triggerType?.name === "Schedule (Cron)") {
        const cronExpression = (triggerMetadata?.cronExpression as string) || "*/30 * * * *";
        const appUrl = process.env.APP_URL || "http://localhost:3001";

        console.log(`⏰ Creating QStash schedule for zap ${zap.id}`);
        console.log(`   Cron: ${cronExpression}`);
        console.log(`   Callback: ${appUrl}/api/cron/${zap.id}`);

        try {
          const schedule = await qstash.schedules.create({
            destination: `${appUrl}/api/cron/${zap.id}`,
            cron: cronExpression,
          });

          console.log(`   ✅ Schedule created: ${schedule.scheduleId}`);

          // Save schedule ID in trigger payload for later cancellation
          triggerPayload = {
            ...triggerMetadata,
            scheduleId: schedule.scheduleId,
          };
        } catch (scheduleError) {
          console.error(`   ❌ Failed to create schedule:`, scheduleError);
          // Still create the zap, just won't be scheduled
          triggerPayload = {
            ...triggerMetadata,
            scheduleError: "Failed to create QStash schedule",
          };
        }
      }

      const trigger = await tx.trigger.create({
        data: {
          zapId: zap.id,
          availableTriggersId: triggerId,
          payload: triggerPayload,
        },
      });

      return await tx.zap.update({
        where: { id: zap.id },
        data: { triggerId: trigger.id },
        include: {
          trigger: { include: { type: true } },
          actions: { include: { type: true } },
        },
      });
    });

    return NextResponse.json({ zap: result });
  } catch (error) {
    console.error("Create zap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
