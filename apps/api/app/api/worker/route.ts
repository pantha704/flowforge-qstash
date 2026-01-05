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
      return NextResponse.json({ error: "ZapRun not found" }, { status: 404 });
    }

    console.log(`📋 Zap has ${zapRun.zap.actions.length} action(s)`);
    console.log(`📦 Trigger payload:`, zapRun.metadata);

    // Execute each action in order
    for (let i = 0; i < zapRun.zap.actions.length; i++) {
      const action = zapRun.zap.actions[i]!;
      const actionName = action.type.name;
      const metadata = action.metadata as Record<string, unknown>;

      console.log(
        `\n--- Action ${i + 1}/${zapRun.zap.actions.length}: ${actionName} ---`
      );

      try {
        await executeAction(actionName, metadata);
        console.log(`✅ Action completed: ${actionName}`);
      } catch (error) {
        console.error(`❌ Action failed: ${actionName}`, error);
        // Continue with next action
      }
    }

    console.log(`\n✨ ZapRun ${zapRunId} completed!\n`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Worker error:", error);
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
