import { prismaClient } from "@repo/db";
import {
  executeAction,
  resolveTemplates,
  isFilterStop,
} from "@repo/executors";
import { NextRequest, NextResponse } from "next/server";
import { assertWorkerAuth } from "../../../lib/security";

async function handler(req: NextRequest) {
  // Opt-in: only enforced when WORKER_SECRET is set
  const authError = assertWorkerAuth(req);
  if (authError) return authError;

  let zapRunId: string | undefined;
  try {
    const body = await req.json();
    zapRunId = body?.zapRunId;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!zapRunId || typeof zapRunId !== "string") {
    return NextResponse.json({ error: "Missing zapRunId" }, { status: 400 });
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Processing ZapRun: ${zapRunId}`);
  console.log(`${"=".repeat(60)}`);

  await prismaClient.zapRun.update({
    where: { id: zapRunId },
    data: { status: "running" },
  });

  try {
    const zapRun = await prismaClient.zapRun.findUnique({
      where: { id: zapRunId },
      include: {
        zap: {
          include: {
            actions: {
              include: {
                type: true,
              },
              orderBy: {
                sortingOrder: "asc",
              },
            },
          },
        },
      },
    });

    if (!zapRun || !zapRun.zap) {
      console.error(`❌ ZapRun not found: ${zapRunId}`);
      await prismaClient.zapRun.update({
        where: { id: zapRunId },
        data: {
          status: "failed",
          error: "ZapRun not found",
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ error: "ZapRun not found" }, { status: 404 });
    }

    let googleAccessToken: string | null = null;
    const userId = zapRun.zap.userId;
    const googleConnection = await prismaClient.userConnection.findUnique({
      where: { userId_provider: { userId, provider: "google" } },
    });
    if (googleConnection) {
      googleAccessToken = googleConnection.accessToken;
      console.log(`🔑 Google OAuth token available for user ${userId}`);
    }

    console.log(`📋 Zap has ${zapRun.zap.actions.length} action(s)`);
    console.log(`📦 Trigger payload:`, zapRun.metadata);

    // Mutable run variables (Set Variable action)
    const vars: Record<string, unknown> = {};

    let hasError = false;
    let errorMessage = "";
    let filteredStop = false;

    for (let i = 0; i < zapRun.zap.actions.length; i++) {
      const action = zapRun.zap.actions[i]!;
      const actionName = action.type.name;
      const rawMetadata = (action.metadata || {}) as Record<string, unknown>;

      const templateContext = {
        trigger: zapRun.metadata,
        run: { id: zapRun.id, zapId: zapRun.zapId, vars },
      };

      const metadata = resolveTemplates(rawMetadata, templateContext) as Record<
        string,
        unknown
      >;

      if (actionName === "Create Spreadsheet Row" && googleAccessToken) {
        metadata._googleAccessToken = googleAccessToken;
      }

      console.log(
        `\n--- Action ${i + 1}/${zapRun.zap.actions.length}: ${actionName} ---`
      );

      try {
        // Set Variable mutates shared vars for later steps
        if (actionName === "Set Variable") {
          const key = String(metadata.key || "").trim();
          if (key) {
            vars[key] = metadata.value ?? "";
            console.log(`   ✅ vars.${key} =`, vars[key]);
          } else {
            console.log(`   ⚠️ Set Variable skipped — empty key`);
          }
          await executeAction(actionName, metadata);
          continue;
        }

        await executeAction(actionName, metadata);
        console.log(`✅ Action completed: ${actionName}`);
      } catch (error) {
        if (isFilterStop(error)) {
          filteredStop = true;
          console.log(`   🛑 Pipeline stopped by Filter Condition`);
          break;
        }
        console.error(`❌ Action failed: ${actionName}`, error);
        hasError = true;
        errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Continue with next action (existing behavior for real failures)
      }
    }

    const status = hasError ? "failed" : "success";
    const finalError = hasError
      ? errorMessage
      : filteredStop
        ? null
        : null;

    await prismaClient.zapRun.update({
      where: { id: zapRunId },
      data: {
        status,
        error: finalError,
        completedAt: new Date(),
      },
    });

    console.log(
      `\n✨ ZapRun ${zapRunId} completed! Status: ${status}${filteredStop ? " (filter stop)" : ""}\n`
    );

    return NextResponse.json({
      success: true,
      status,
      filtered: filteredStop,
    });
  } catch (error) {
    console.error("Worker error:", error);

    await prismaClient.zapRun.update({
      where: { id: zapRunId },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export { handler as POST };
