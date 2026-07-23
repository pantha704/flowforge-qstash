import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import { enqueueWorker } from "../../../../../lib/enqueue-worker";
import { fetchFeedItems } from "../../../../../lib/rss";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

/**
 * POST /api/poll/rss/:zapId
 * Called by QStash on a schedule. Fetches the feed and starts a ZapRun
 * when a new item (by guid) appears.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ zapId: string }> }
) {
  const { zapId } = await params;
  console.log(`📰 [RSS Poll] Zap: ${zapId}`);

  try {
    const zap = await prismaClient.zap.findUnique({
      where: { id: zapId },
      include: {
        trigger: { include: { type: true } },
        _count: { select: { ZapRuns: true } },
      },
    });

    if (!zap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    if (!zap.isActive) {
      return NextResponse.json({ success: false, message: "Zap is inactive" });
    }

    if (zap.maxRuns > 0 && zap._count.ZapRuns >= zap.maxRuns) {
      try {
        const scheduleId = (zap.trigger?.payload as { scheduleId?: string })
          ?.scheduleId;
        if (scheduleId) await qstash.schedules.delete(scheduleId);
      } catch (e) {
        console.error("Failed to cancel RSS schedule:", e);
      }
      return NextResponse.json({
        success: false,
        message: "Run limit reached",
      });
    }

    const payload = (zap.trigger?.payload || {}) as {
      feedUrl?: string;
      lastGuid?: string;
      scheduleId?: string;
      pollCron?: string;
    };

    const feedUrl = payload.feedUrl?.trim();
    if (!feedUrl) {
      console.warn("   ⚠️ No feedUrl configured");
      return NextResponse.json({
        success: false,
        error: "No feedUrl in trigger metadata",
      });
    }

    const items = await fetchFeedItems(feedUrl);
    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No items in feed",
        newItem: false,
      });
    }

    // Newest first when possible
    const latest = items[0]!;
    if (payload.lastGuid && payload.lastGuid === latest.guid) {
      console.log(`   ✓ No new items (lastGuid=${payload.lastGuid})`);
      return NextResponse.json({
        success: true,
        newItem: false,
        lastGuid: payload.lastGuid,
      });
    }

    // First poll after create: record guid without firing (avoid historical spam)
    if (!payload.lastGuid) {
      await prismaClient.trigger.update({
        where: { zapId },
        data: {
          payload: {
            ...payload,
            lastGuid: latest.guid,
            lastPolledAt: new Date().toISOString(),
          },
        },
      });
      console.log(`   📌 Baseline set to ${latest.guid} (no run on first poll)`);
      return NextResponse.json({
        success: true,
        newItem: false,
        baselined: true,
        lastGuid: latest.guid,
      });
    }

    // New item — fire zap
    const zapRun = await prismaClient.zapRun.create({
      data: {
        zapId,
        metadata: {
          triggeredBy: "rss",
          feedUrl,
          title: latest.title,
          link: latest.link,
          description: latest.description,
          guid: latest.guid,
          publishedAt: latest.publishedAt,
          // aliases for templates
          message: latest.title,
          url: latest.link,
        } as object,
        status: "pending",
      },
    });

    await prismaClient.trigger.update({
      where: { zapId },
      data: {
        payload: {
          ...payload,
          lastGuid: latest.guid,
          lastPolledAt: new Date().toISOString(),
        },
      },
    });

    await enqueueWorker(zapRun.id);
    console.log(`   ✅ New item → ZapRun ${zapRun.id}: ${latest.title}`);

    return NextResponse.json({
      success: true,
      newItem: true,
      zapRunId: zapRun.id,
      title: latest.title,
    });
  } catch (error) {
    console.error(`   ❌ RSS poll error:`, error);
    return NextResponse.json(
      {
        error: "RSS poll failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
