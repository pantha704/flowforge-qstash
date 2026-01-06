import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Helper to get user ID from JWT
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

/**
 * GET /api/connections - List user's connected services
 */
export async function GET(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const connections = await prismaClient.userConnection.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        scope: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({ success: true, connections });
  } catch (error) {
    console.error("Get connections error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/connections?provider=google - Disconnect a service
 */
export async function DELETE(req: NextRequest) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");

  if (!provider) {
    return NextResponse.json({ error: "Provider required" }, { status: 400 });
  }

  try {
    await prismaClient.userConnection.delete({
      where: { userId_provider: { userId, provider } },
    });

    return NextResponse.json({ success: true, message: `${provider} disconnected` });
  } catch (error) {
    console.error("Delete connection error:", error);
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }
}
