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

// GET /api/zap/[id] - Get a single zap
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const zap = await prismaClient.zap.findFirst({
      where: { id, userId },
      include: {
        trigger: { include: { type: true } },
        actions: { include: { type: true }, orderBy: { sortingOrder: "asc" } },
      },
    });

    if (!zap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, zap });
  } catch (error) {
    console.error("Get zap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/zap/[id] - Delete a zap
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First verify the zap belongs to this user and get trigger info
    const zap = await prismaClient.zap.findFirst({
      where: { id, userId },
      include: { trigger: true },
    });

    if (!zap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    // Cancel QStash schedule if exists
    const scheduleId = (zap.trigger?.payload as { scheduleId?: string })?.scheduleId;
    if (scheduleId) {
      try {
        await qstash.schedules.delete(scheduleId);
        console.log(`🛑 Cancelled schedule ${scheduleId} for zap ${id}`);
      } catch (e) {
        console.error(`Failed to cancel schedule ${scheduleId}:`, e);
      }
    }

    // Delete related records first (cascade manually)
    await prismaClient.$transaction(async (tx) => {
      // Delete ZapRuns for this zap
      await tx.zapRun.deleteMany({ where: { zapId: id } });

      // Delete Actions for this zap
      await tx.action.deleteMany({ where: { zapId: id } });

      // Delete Trigger for this zap
      await tx.trigger.deleteMany({ where: { zapId: id } });

      // Finally delete the zap
      await tx.zap.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "Zap deleted successfully" });
  } catch (error) {
    console.error("Delete zap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
