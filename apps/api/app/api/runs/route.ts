import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/runs - Get all zap runs (with optional filtering)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const runs = await prismaClient.zapRun.findMany({
      where: {
        zap: {
          userId: parseInt(userId),
        },
      },
      include: {
        zap: {
          include: {
            trigger: {
              include: { type: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Format the response
    const formattedRuns = runs.map((run) => ({
      id: run.id,
      zapId: run.zapId,
      zapName: run.zap.trigger?.type.name || "Unknown Trigger",
      status: run.status,
      error: run.error,
      metadata: run.metadata,
      createdAt: run.createdAt,
      completedAt: run.completedAt,
    }));

    return NextResponse.json({
      success: true,
      runs: formattedRuns,
      total: formattedRuns.length,
    });
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}
