import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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

  const { triggerId, triggerMetadata, actions } = await req.json();

  try {
    const result = await prismaClient.$transaction(async (tx) => {
      const zap = await tx.zap.create({
        data: {
          userId,
          triggerId: "",
          actions: {
            create: actions.map((a: { availableActionId: string; actionMetadata: object }, i: number) => ({
              actionId: a.availableActionId,
              sortingOrder: i,
              metadata: a.actionMetadata || {},
            })),
          },
        },
      });

      const trigger = await tx.trigger.create({
        data: {
          zapId: zap.id,
          availableTriggersId: triggerId,
          payload: triggerMetadata || {},
        },
      });

      return await tx.zap.update({
        where: { id: zap.id },
        data: { triggerId: trigger.id },
      });
    });

    return NextResponse.json({ zap: result });
  } catch (error) {
    console.error("Create zap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
