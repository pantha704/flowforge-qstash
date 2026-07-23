import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { isTriggerReady } from "../../../../lib/trigger-catalog";

/**
 * GET /api/trigger/available
 * Returns seeded triggers with readiness flags.
 * - Default: all triggers (UI greys out coming soon)
 * - ?readyOnly=1: only fully implemented triggers
 */
export async function GET(req: NextRequest) {
  try {
    const readyOnly = req.nextUrl.searchParams.get("readyOnly") === "1";
    const triggers = await prismaClient.availableTriggers.findMany();

    let availableTriggers = triggers.map((t) => ({
      id: t.id,
      name: t.name,
      ready: isTriggerReady(t.name),
      comingSoon: !isTriggerReady(t.name),
    }));

    if (readyOnly) {
      availableTriggers = availableTriggers.filter((t) => t.ready);
    }

    return NextResponse.json({
      success: true,
      availableTriggers,
    });
  } catch (error) {
    console.error("Get triggers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
