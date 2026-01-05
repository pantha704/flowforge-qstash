import { Client } from "@upstash/qstash";
import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

// Helper to get user ID from token
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

/**
 * POST /api/schedule
 * Create a scheduled trigger for a zap using QStash Schedules
 *
 * Body: { zapId: string, cron: string }
 * Example cron: "0 9 * * *" = every day at 9 AM UTC
 */
export async function POST(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { zapId, cron } = await req.json();

  if (!zapId || !cron) {
    return NextResponse.json(
      { error: "Missing zapId or cron expression" },
      { status: 400 }
    );
  }

  try {
    // Verify user owns this zap
    const zap = await prismaClient.zap.findFirst({
      where: { id: zapId, userId },
    });

    if (!zap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    // Create QStash schedule
    const schedule = await qstash.schedules.create({
      destination: `${process.env.APP_URL}/api/hooks/${userId}/${zapId}`,
      cron,
      body: JSON.stringify({ trigger: "schedule", scheduledAt: new Date().toISOString() }),
      headers: { "Content-Type": "application/json" },
    });

    console.log(`[Schedule] Created schedule ${schedule.scheduleId} for zap ${zapId}`);

    // Store schedule ID in trigger metadata for later management
    await prismaClient.trigger.update({
      where: { zapId },
      data: {
        payload: {
          scheduleId: schedule.scheduleId,
          cron,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      scheduleId: schedule.scheduleId,
      cron,
      message: `Schedule created. Zap will run on cron: ${cron}`,
    });
  } catch (error) {
    console.error("[Schedule] Error:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/schedule
 * Delete a scheduled trigger
 *
 * Body: { zapId: string }
 */
export async function DELETE(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { zapId } = await req.json();

  try {
    // Get the schedule ID from trigger metadata
    const trigger = await prismaClient.trigger.findFirst({
      where: { zap: { id: zapId, userId } },
    });

    const payload = trigger?.payload as { scheduleId?: string } | null;
    if (!payload?.scheduleId) {
      return NextResponse.json({ error: "No schedule found for this zap" }, { status: 404 });
    }

    // Delete from QStash
    await qstash.schedules.delete(payload.scheduleId);

    console.log(`[Schedule] Deleted schedule ${payload.scheduleId}`);

    // Clear schedule from trigger metadata
    await prismaClient.trigger.update({
      where: { zapId },
      data: { payload: {} },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule deleted",
    });
  } catch (error) {
    console.error("[Schedule] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/schedule?zapId=xxx
 * Get schedule info for a zap
 */
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zapId = req.nextUrl.searchParams.get("zapId");
  if (!zapId) {
    return NextResponse.json({ error: "Missing zapId" }, { status: 400 });
  }

  try {
    const trigger = await prismaClient.trigger.findFirst({
      where: { zap: { id: zapId, userId } },
    });

    const payload = trigger?.payload as { scheduleId?: string; cron?: string } | null;

    if (!payload?.scheduleId) {
      return NextResponse.json({ hasSchedule: false });
    }

    // Get schedule status from QStash
    try {
      const schedule = await qstash.schedules.get(payload.scheduleId);
      return NextResponse.json({
        hasSchedule: true,
        scheduleId: payload.scheduleId,
        cron: schedule.cron,
        isPaused: schedule.isPaused,
      });
    } catch {
      // Schedule might have been deleted externally
      return NextResponse.json({ hasSchedule: false });
    }
  } catch (error) {
    console.error("[Schedule] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get schedule" },
      { status: 500 }
    );
  }
}
