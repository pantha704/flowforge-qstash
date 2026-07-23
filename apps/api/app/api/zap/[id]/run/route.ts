import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { enqueueWorker } from "../../../../../lib/enqueue-worker";

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
 * POST /api/zap/:id/run
 * Manual / test fire — creates a ZapRun with optional sample payload.
 * Works for any zap the user owns (great for Manual trigger + demos).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: zapId } = await params;

  let body: { payload?: Record<string, unknown> } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const zap = await prismaClient.zap.findFirst({
      where: { id: zapId, userId },
      include: {
        trigger: { include: { type: true } },
        _count: { select: { ZapRuns: true } },
      },
    });

    if (!zap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    if (!zap.isActive) {
      return NextResponse.json(
        { success: false, error: "Zap is disabled" },
        { status: 403 }
      );
    }

    if (zap.maxRuns > 0 && zap._count.ZapRuns >= zap.maxRuns) {
      return NextResponse.json(
        { success: false, error: "Run limit reached" },
        { status: 429 }
      );
    }

    const userPayload =
      body.payload && typeof body.payload === "object" ? body.payload : {};

    const metadata = {
      triggeredBy: "manual",
      triggeredAt: new Date().toISOString(),
      ...userPayload,
    };

    const zapRun = await prismaClient.zapRun.create({
      data: {
        zapId,
        metadata: metadata as object,
        status: "pending",
      },
    });

    const worker = await enqueueWorker(zapRun.id);

    return NextResponse.json({
      success: true,
      zapRunId: zapRun.id,
      workerOk: worker.ok,
      message: "Test run started",
    });
  } catch (error) {
    console.error("[Manual Run] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
