import { Client } from "@upstash/qstash";
import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; zapId: string }> }
) {
  const { userId, zapId } = await params;
  const body = await req.json();

  try {
    // Create ZapRun (no outbox needed - QStash handles queuing)
    const zapRun = await prismaClient.zapRun.create({
      data: {
        zapId,
        metadata: body,
      },
    });

    console.log(`[Hook] ZapRun created: ${zapRun.id}`);

    // Publish to QStash - it will call our worker endpoint
    await qstash.publishJSON({
      url: `${process.env.APP_URL}/api/worker`,
      body: { zapRunId: zapRun.id },
      retries: 3,
    });

    console.log(`[Hook] Published to QStash for processing`);

    return NextResponse.json({
      success: true,
      message: "Hook processed successfully",
      zapRunId: zapRun.id,
    });
  } catch (error) {
    console.error("[Hook] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
