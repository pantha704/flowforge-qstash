import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { assertWebhookSignature } from "../../../../../lib/security";
import { enqueueWorker } from "../../../../../lib/enqueue-worker";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; zapId: string }> }
) {
  const { userId, zapId } = await params;

  console.log(`[Hook] Received webhook for user ${userId}, zap ${zapId}`);

  // Parse body - handle empty or invalid JSON (keep raw text for HMAC)
  let rawText = "";
  let body: Record<string, unknown> = {};
  try {
    rawText = await req.text();
    if (rawText) {
      body = JSON.parse(rawText);
    }
  } catch {
    console.log("[Hook] No JSON body or invalid JSON, using empty object");
    body = {};
  }

  try {
    // Validate the zap exists and check run limit
    const zap = await prismaClient.zap.findUnique({
      where: { id: zapId },
      include: {
        actions: true,
        trigger: true,
        _count: { select: { ZapRuns: true } },
      },
    });

    if (!zap) {
      console.error(`[Hook] Zap not found: ${zapId}`);
      return NextResponse.json(
        { success: false, error: "Zap not found" },
        { status: 404 }
      );
    }

    if (zap.userId !== parseInt(userId, 10)) {
      console.error(`[Hook] User mismatch: expected ${zap.userId}, got ${userId}`);
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Optional HMAC: only when user configured webhookSecret on the trigger
    const triggerPayload = (zap.trigger?.payload || {}) as {
      webhookSecret?: string;
    };
    const sigError = assertWebhookSignature(
      rawText,
      triggerPayload.webhookSecret,
      req
    );
    if (sigError) return sigError;

    // Check if zap is disabled
    if (!zap.isActive) {
      console.log(`[Hook] Zap ${zapId} is disabled, skipping execution`);
      return NextResponse.json(
        { success: false, error: "Zap is disabled" },
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
          maxRuns: zap.maxRuns,
        },
        { status: 429 }
      );
    }

    // Create ZapRun with pending status
    const zapRun = await prismaClient.zapRun.create({
      data: {
        zapId,
        // Prisma Json input accepts plain objects; cast keeps TS happy
        metadata: body as object,
        status: "pending",
      },
    });

    console.log(
      `[Hook] ZapRun created: ${zapRun.id} (${runCount + 1}/${zap.maxRuns === -1 ? "∞" : zap.maxRuns})`
    );

    // Direct worker call (opt-in WORKER_SECRET via enqueueWorker)
    const worker = await enqueueWorker(zapRun.id);
    if (!worker.ok) {
      console.warn(`[Hook] Worker returned non-OK: ${worker.status ?? "network error"}`);
    } else {
      console.log(`[Hook] Worker triggered`);
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
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
