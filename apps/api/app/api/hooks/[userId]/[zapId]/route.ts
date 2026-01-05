import { Client } from "@upstash/qstash";
import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; zapId: string }> }
) {
  const { userId, zapId } = await params;

  console.log(`[Hook] Received webhook for user ${userId}, zap ${zapId}`);

  // Parse body - handle empty or invalid JSON
  let body = {};
  try {
    const text = await req.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch (e) {
    console.log("[Hook] No JSON body or invalid JSON, using empty object");
  }

  try {
    // Validate the zap exists and check run limit
    const zap = await prismaClient.zap.findUnique({
      where: { id: zapId },
      include: {
        actions: true,
        _count: { select: { ZapRuns: true } }
      },
    });

    if (!zap) {
      console.error(`[Hook] Zap not found: ${zapId}`);
      return NextResponse.json(
        { success: false, error: "Zap not found" },
        { status: 404 }
      );
    }

    if (zap.userId !== parseInt(userId)) {
      console.error(`[Hook] User mismatch: expected ${zap.userId}, got ${userId}`);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check run limit
    const runCount = zap._count.ZapRuns;
    if (zap.maxRuns > 0 && runCount >= zap.maxRuns) {
      console.log(`[Hook] Run limit reached: ${runCount}/${zap.maxRuns}`);
      return NextResponse.json(
        {
          success: false,
          error: "Run limit reached",
          runCount,
          maxRuns: zap.maxRuns
        },
        { status: 429 }
      );
    }

    // Create ZapRun with pending status
    const zapRun = await prismaClient.zapRun.create({
      data: {
        zapId,
        metadata: body,
        status: "pending",
      },
    });

    console.log(`[Hook] ZapRun created: ${zapRun.id} (${runCount + 1}/${zap.maxRuns === -1 ? '∞' : zap.maxRuns})`);

    // Check if we're in local dev mode (QStash can't call localhost)
    const isLocalDev = process.env.APP_URL?.includes("localhost");

    if (isLocalDev) {
      // For local development: call worker directly
      console.log(`[Hook] Local mode - calling worker directly`);
      const workerResponse = await fetch(
        `${process.env.APP_URL}/api/worker`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zapRunId: zapRun.id }),
        }
      );
      console.log(`[Hook] Worker response: ${workerResponse.status}`);
    } else {
      // For production: publish to QStash
      console.log(`[Hook] Publishing to QStash for processing`);

      if (!process.env.QSTASH_TOKEN) {
        console.error("[Hook] QSTASH_TOKEN not configured");
        return NextResponse.json(
          { success: false, error: "QStash not configured" },
          { status: 500 }
        );
      }

      await qstash.publishJSON({
        url: `${process.env.APP_URL}/api/worker`,
        body: { zapRunId: zapRun.id },
        retries: 3,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Hook processed successfully",
      zapRunId: zapRun.id,
      runCount: runCount + 1,
      maxRuns: zap.maxRuns === -1 ? "unlimited" : zap.maxRuns,
    });
  } catch (error) {
    console.error("[Hook] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
