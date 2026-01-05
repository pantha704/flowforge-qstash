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

    // Check if we're in local dev mode (QStash can't call localhost)
    const isLocalDev = process.env.APP_URL?.includes("localhost");

    if (isLocalDev) {
      // For local development: call worker directly
      console.log(`[Hook] Local mode - calling worker directly`);
      const workerResponse = await fetch(
        `${process.env.APP_URL}/api/worker`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zapRunId: zapRun.id }),
        }
      );
      console.log(`[Hook] Worker response: ${workerResponse.status}`);
    } else {
      // For production: publish to QStash
      console.log(`[Hook] Publishing to QStash for processing`);
      await qstash.publishJSON({
        url: `${process.env.APP_URL}/api/worker`,
        body: { zapRunId: zapRun.id },
        retries: 3,
      });
    }

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
