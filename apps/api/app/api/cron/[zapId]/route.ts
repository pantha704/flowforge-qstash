import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

/**
 * POST /api/cron/[zapId] - QStash scheduled callback
 *
 * This route is called by QStash at the scheduled times.
 * It creates a ZapRun and queues the actions to the worker.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ zapId: string }> }
) {
  const { zapId } = await params;

  console.log(`⏰ [Cron Trigger] Zap: ${zapId}`);

  try {
    // Get the zap with its actions
    const zap = await prismaClient.zap.findUnique({
      where: { id: zapId },
      include: {
        trigger: { include: { type: true } },
        actions: { include: { type: true }, orderBy: { sortingOrder: "asc" } },
        _count: { select: { ZapRuns: true } },
      },
    });

    if (!zap) {
      console.error(`   ❌ Zap not found: ${zapId}`);
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    // ponytail: skip inactive zaps, no need to fan-out work for paused zaps
    if (!zap.isActive) {
      console.log(`   ⏸️ Zap is inactive, skipping`);
      return NextResponse.json({ success: false, message: "Zap is inactive" });
    }

    // Check run limit
    if (zap.maxRuns !== -1 && zap._count.ZapRuns >= zap.maxRuns) {
      console.log(`   ⚠️ Run limit reached (${zap._count.ZapRuns}/${zap.maxRuns})`);
      // Cancel the schedule
      try {
        const scheduleId = (zap.trigger?.payload as { scheduleId?: string })?.scheduleId;
        if (scheduleId) {
          await qstash.schedules.delete(scheduleId);
          console.log(`   🛑 Schedule ${scheduleId} cancelled`);
        }
      } catch (e) {
        console.error(`   Failed to cancel schedule:`, e);
      }
      return NextResponse.json({
        success: false,
        message: "Run limit reached, schedule cancelled"
      });
    }

    // Create a ZapRun record
    const zapRun = await prismaClient.zapRun.create({
      data: {
        zapId,
        metadata: { triggeredBy: "schedule", scheduledAt: new Date().toISOString() },
        status: "pending",
      },
    });

    console.log(`   📝 Created ZapRun: ${zapRun.id}`);

    // ponytail: call worker directly instead of QStash double-hop (saves rate limit)
    const appUrl = process.env.APP_URL || "http://localhost:3001";
    await fetch(`${appUrl}/api/worker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zapRunId: zapRun.id, stage: 0 }),
    });

    console.log(`   ✅ Triggered worker`);

    return NextResponse.json({ success: true, zapRunId: zapRun.id });
  } catch (error) {
    console.error(`   ❌ Cron trigger error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cron/[zapId] - Cancel a schedule
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ zapId: string }> }
) {
  const { zapId } = await params;

  console.log(`🛑 [Cancel Schedule] Zap: ${zapId}`);

  try {
    const zap = await prismaClient.zap.findUnique({
      where: { id: zapId },
      include: { trigger: true },
    });

    if (!zap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    const scheduleId = (zap.trigger?.payload as { scheduleId?: string })?.scheduleId;
    if (scheduleId) {
      await qstash.schedules.delete(scheduleId);
      console.log(`   ✅ Schedule ${scheduleId} cancelled`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`   ❌ Cancel schedule error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
