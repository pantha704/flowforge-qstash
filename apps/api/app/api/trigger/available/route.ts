import { prismaClient } from "@repo/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("[API] DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 50) + "...");
    const triggers = await prismaClient.availableTriggers.findMany();
    console.log("[API] Found triggers:", triggers.length);
    return NextResponse.json({
      success: true,
      availableTriggers: triggers,
    });
  } catch (error) {
    console.error("[API] Get triggers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
