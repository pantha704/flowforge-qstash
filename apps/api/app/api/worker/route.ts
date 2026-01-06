import { prismaClient } from "@repo/db";
import { executeAction } from "@repo/executors";
import { NextRequest, NextResponse } from "next/server";

// For production, you would use verifySignatureAppRouter from @upstash/qstash/nextjs
// import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

async function handler(req: NextRequest) {
  const { zapRunId } = await req.json();

  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 Processing ZapRun: ${zapRunId}`);
  console.log(`${"=".repeat(60)}`);

  // Update status to running
  await prismaClient.zapRun.update({
    where: { id: zapRunId },
    data: { status: "running" },
  });

  try {
    // Fetch the zap with its actions
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

    // Fetch user's Google OAuth token for Sheets/Drive actions
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

    let hasError = false;
    let errorMessage = "";

    // Execute each action in order
    for (let i = 0; i < zapRun.zap.actions.length; i++) {
      const action = zapRun.zap.actions[i]!;
      const actionName = action.type.name;
      const metadata = action.metadata as Record<string, unknown>;

      // Inject OAuth tokens for Google-related actions
      if (actionName === "Create Spreadsheet Row" && googleAccessToken) {
        metadata._googleAccessToken = googleAccessToken;
      }

      console.log(
        `\n--- Action ${i + 1}/${zapRun.zap.actions.length}: ${actionName} ---`
      );

      try {
        await executeAction(actionName, metadata);
        console.log(`✅ Action completed: ${actionName}`);
      } catch (error) {
        console.error(`❌ Action failed: ${actionName}`, error);
        hasError = true;
        errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Continue with next action (don't break)
      }
    }


    // Update final status
    await prismaClient.zapRun.update({
      where: { id: zapRunId },
      data: {
        status: hasError ? "failed" : "success",
        error: hasError ? errorMessage : null,
        completedAt: new Date(),
      },
    });

    console.log(`\n✨ ZapRun ${zapRunId} completed! Status: ${hasError ? "failed" : "success"}\n`);

    return NextResponse.json({
      success: true,
      status: hasError ? "failed" : "success",
    });
  } catch (error) {
    console.error("Worker error:", error);

    // Update status to failed
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

// For production with QStash signature verification:
// export const POST = verifySignatureAppRouter(handler);

// For local development (no QStash callback verification):
export { handler as POST };
