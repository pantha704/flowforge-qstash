import { prismaClient } from "@repo/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const triggers = await prismaClient.availableTriggers.findMany();
    return NextResponse.json({
      success: true,
      availableTriggers: triggers,
    });
  } catch (error) {
    console.error("Get triggers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
