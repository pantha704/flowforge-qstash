import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Client } from "@upstash/qstash";

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

// Middleware helper to verify auth
function getUserIdFromToken(req: NextRequest): number | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || "secret") as { id: number };
    return decoded.id;
  } catch {
    return null;
  }
}

// GET /api/zap/[id] - Get a single zap
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const zap = await prismaClient.zap.findFirst({
      where: { id, userId },
      include: {
        trigger: { include: { type: true } },
        actions: { include: { type: true }, orderBy: { sortingOrder: "asc" } },
      },
    });

    if (!zap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, zap });
  } catch (error) {
    console.error("Get zap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/zap/[id] - Delete a zap
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First verify the zap belongs to this user and get trigger info
    const zap = await prismaClient.zap.findFirst({
      where: { id, userId },
      include: { trigger: true },
    });

    if (!zap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    // Cancel QStash schedule if exists
    const scheduleId = (zap.trigger?.payload as { scheduleId?: string })?.scheduleId;
    if (scheduleId) {
      try {
        await qstash.schedules.delete(scheduleId);
        console.log(`🛑 Cancelled schedule ${scheduleId} for zap ${id}`);
      } catch (e) {
        console.error(`Failed to cancel schedule ${scheduleId}:`, e);
      }
    }

    // Delete related records first (cascade manually)
    await prismaClient.$transaction(async (tx) => {
      // Delete ZapRuns for this zap
      await tx.zapRun.deleteMany({ where: { zapId: id } });

      // Delete Actions for this zap
      await tx.action.deleteMany({ where: { zapId: id } });

      // Delete Trigger for this zap
      await tx.trigger.deleteMany({ where: { zapId: id } });

      // Finally delete the zap
      await tx.zap.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "Zap deleted successfully" });
  } catch (error) {
    console.error("Delete zap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/zap/[id] - Update zap (toggle isActive)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    // Verify the zap belongs to this user and get trigger info
    const existingZap = await prismaClient.zap.findFirst({
      where: { id, userId },
      include: { trigger: { include: { type: true } } },
    });

    if (!existingZap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    // Update only allowed fields
    const updateData: { isActive?: boolean } = {};
    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive;
    }

    // Handle Schedule (Cron) triggers - pause/resume QStash schedule
    const isScheduleTrigger = existingZap.trigger?.type?.name === "Schedule (Cron)";
    const triggerPayload = existingZap.trigger?.payload as {
      scheduleId?: string;
      cronExpression?: string;
      timezone?: string
    } | null;

    if (isScheduleTrigger && typeof body.isActive === "boolean") {
      if (!body.isActive && triggerPayload?.scheduleId) {
        // PAUSING: Delete the QStash schedule
        try {
          await qstash.schedules.delete(triggerPayload.scheduleId);
          console.log(`⏸️ Paused schedule ${triggerPayload.scheduleId} for zap ${id}`);
        } catch (e) {
          console.error(`Failed to pause schedule ${triggerPayload.scheduleId}:`, e);
        }
      } else if (body.isActive && triggerPayload?.cronExpression) {
        // RESUMING: Re-create the QStash schedule
        try {
          // Build the correct webhook URL
          const baseUrl = process.env.NEXT_PUBLIC_API_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
            || 'http://localhost:3001';
          const webhookUrl = `${baseUrl}/api/cron/${id}`;

          console.log(`▶️ Creating schedule with URL: ${webhookUrl}`);

          const schedule = await qstash.schedules.create({
            destination: webhookUrl,
            cron: triggerPayload.cronExpression,
            body: JSON.stringify({ zapId: id, userId: existingZap.userId }),
          });

          console.log(`▶️ Resumed schedule ${schedule.scheduleId} for zap ${id}`);

          // Update the trigger with new scheduleId
          if (existingZap.trigger) {
            await prismaClient.trigger.update({
              where: { id: existingZap.trigger.id },
              data: {
                payload: {
                  ...triggerPayload,
                  scheduleId: schedule.scheduleId,
                },
              },
            });
          }
        } catch (e) {
          console.error(`Failed to resume schedule for zap ${id}:`, e);
        }
      }
    }

    const zap = await prismaClient.zap.update({
      where: { id },
      data: updateData,
      include: {
        trigger: { include: { type: true } },
        actions: { include: { type: true }, orderBy: { sortingOrder: "asc" } },
      },
    });

    console.log(`🔄 Zap ${id} toggled: isActive=${zap.isActive}`);
    return NextResponse.json({ success: true, zap });
  } catch (error) {
    console.error("Update zap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/zap/[id] - Full update of zap (edit trigger metadata, actions, maxRuns)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromToken(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    // Verify the zap belongs to this user
    const existingZap = await prismaClient.zap.findFirst({
      where: { id, userId },
      include: {
        trigger: { include: { type: true } },
        actions: true
      },
    });

    if (!existingZap) {
      return NextResponse.json({ error: "Zap not found" }, { status: 404 });
    }

    // Update trigger metadata if provided
    if (body.triggerMetadata && existingZap.trigger) {
      const isScheduleTrigger = existingZap.trigger.type?.name === "Schedule (Cron)";
      const oldPayload = existingZap.trigger.payload as {
        scheduleId?: string;
        cronExpression?: string;
        timezone?: string;
      } | null;
      const newPayload = body.triggerMetadata as {
        cronExpression?: string;
        timezone?: string;
      };

      // If cron expression changed, update QStash schedule
      if (isScheduleTrigger && existingZap.isActive &&
          (oldPayload?.cronExpression !== newPayload.cronExpression)) {
        try {
          // Delete old schedule
          if (oldPayload?.scheduleId) {
            await qstash.schedules.delete(oldPayload.scheduleId);
            console.log(`🔄 Deleted old schedule ${oldPayload.scheduleId}`);
          }

          // Create new schedule
          const baseUrl = process.env.NEXT_PUBLIC_API_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
            || 'http://localhost:3001';
          const webhookUrl = `${baseUrl}/api/cron/${id}`;

          console.log(`🔄 Updating schedule with URL: ${webhookUrl}`);

          const schedule = await qstash.schedules.create({
            destination: webhookUrl,
            cron: newPayload.cronExpression!,
            body: JSON.stringify({ zapId: id, userId }),
          });

          // Update trigger with new scheduleId
          await prismaClient.trigger.update({
            where: { id: existingZap.trigger.id },
            data: {
              payload: {
                ...body.triggerMetadata,
                scheduleId: schedule.scheduleId,
              },
            },
          });

          console.log(`✅ Created new schedule ${schedule.scheduleId}`);
        } catch (e) {
          console.error("Failed to update QStash schedule:", e);
        }
      } else {
        // Just update the payload without touching QStash
        await prismaClient.trigger.update({
          where: { id: existingZap.trigger.id },
          data: {
            payload: {
              ...(oldPayload || {}),
              ...body.triggerMetadata,
            },
          },
        });
      }
    }

    // Update actions if provided
    if (body.actions && Array.isArray(body.actions)) {
      for (const actionData of body.actions) {
        if (actionData.id) {
          // Update existing action
          await prismaClient.action.update({
            where: { id: actionData.id },
            data: {
              metadata: actionData.actionMetadata,
            },
          });
        }
      }
    }

    // Update maxRuns if provided
    if (typeof body.maxRuns === "number") {
      await prismaClient.zap.update({
        where: { id },
        data: { maxRuns: body.maxRuns },
      });
    }

    // Update name/description if provided
    const zapUpdateData: { name?: string; description?: string } = {};
    if (typeof body.name === "string") {
      zapUpdateData.name = body.name || null;
    }
    if (typeof body.description === "string") {
      zapUpdateData.description = body.description || null;
    }
    if (Object.keys(zapUpdateData).length > 0) {
      await prismaClient.zap.update({
        where: { id },
        data: zapUpdateData,
      });
    }

    // Fetch updated zap
    const zap = await prismaClient.zap.findFirst({
      where: { id },
      include: {
        trigger: { include: { type: true } },
        actions: { include: { type: true }, orderBy: { sortingOrder: "asc" } },
      },
    });

    console.log(`✏️ Zap ${id} updated`);
    return NextResponse.json({ success: true, zap });
  } catch (error) {
    console.error("Edit zap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
