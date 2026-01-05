import { prismaClient } from "@repo/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const actions = await prismaClient.availableActions.findMany();
    return NextResponse.json({
      success: true,
      availableActions: actions,
    });
  } catch (error) {
    console.error("Get actions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
