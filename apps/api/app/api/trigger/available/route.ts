import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import {
  getTriggerUnavailableReason,
  isTriggerReady,
} from "../../../../lib/trigger-catalog";

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

    let availableTriggers = triggers.map((t) => {
      const ready = isTriggerReady(t.name);
      return {
        id: t.id,
        name: t.name,
        ready,
        comingSoon: !ready,
        disabledReason: ready ? null : getTriggerUnavailableReason(t.name),
      };
    });

    // Ready first so the picker is scannable
    availableTriggers.sort((a, b) => Number(b.ready) - Number(a.ready));

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
