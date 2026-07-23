import { prismaClient } from "@repo/db";
import { NextRequest, NextResponse } from "next/server";
import { enqueueWorker } from "../../../../../lib/enqueue-worker";

/**
 * Tier B: New Form Submission trigger
 *
 * GET  /api/forms/:userId/:zapId  → simple public HTML form (demo)
 * POST /api/forms/:userId/:zapId  → accept JSON or form-urlencoded → ZapRun
 *
 * Safe guards match webhook hooks (isActive, maxRuns, ownership).
 */

async function loadFormZap(userId: string, zapId: string) {
  const zap = await prismaClient.zap.findUnique({
    where: { id: zapId },
    include: {
      trigger: { include: { type: true } },
      _count: { select: { ZapRuns: true } },
    },
  });

  if (!zap) return { error: "Zap not found" as const, status: 404 as const };
  if (zap.userId !== parseInt(userId, 10)) {
    return { error: "Unauthorized" as const, status: 403 as const };
  }

  const triggerName = zap.trigger?.type?.name;
  if (triggerName && triggerName !== "New Form Submission") {
    // Soft warning only — still allow if user repurposed; but prefer correct type
    console.warn(
      `[Form] Zap ${zapId} trigger is "${triggerName}", expected "New Form Submission"`
    );
  }

  return { zap };
}

async function createRunAndEnqueue(
  zapId: string,
  maxRuns: number,
  runCount: number,
  metadata: Record<string, unknown>
) {
  if (maxRuns > 0 && runCount >= maxRuns) {
    return {
      response: NextResponse.json(
        { success: false, error: "Run limit reached", runCount, maxRuns },
        { status: 429 }
      ),
    };
  }

  const zapRun = await prismaClient.zapRun.create({
    data: {
      zapId,
      metadata: {
        triggeredBy: "form",
        submittedAt: new Date().toISOString(),
        ...metadata,
      } as object,
      status: "pending",
    },
  });

  await enqueueWorker(zapRun.id);
  return { zapRun };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; zapId: string }> }
) {
  const { userId, zapId } = await params;
  const result = await loadFormZap(userId, zapId);

  if ("error" in result) {
    return new NextResponse(`<h1>${result.error}</h1>`, {
      status: result.status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const { zap } = result;
  if (!zap.isActive) {
    return new NextResponse(`<h1>This form is currently paused</h1>`, {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const payload = (zap.trigger?.payload || {}) as {
    title?: string;
    description?: string;
    fields?: string;
    successMessage?: string;
  };

  const title = payload.title || zap.name || "Submit a form";
  const description = payload.description || zap.description || "";
  const fieldNames = (payload.fields || "name,email,message")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  const successMessage =
    payload.successMessage || "Thanks! Your response was submitted.";

  // If ?json=1 return machine-readable config (for embeds / tests)
  if (req.nextUrl.searchParams.get("json") === "1") {
    return NextResponse.json({
      success: true,
      form: {
        title,
        description,
        fields: fieldNames,
        successMessage,
        postUrl: `/api/forms/${userId}/${zapId}`,
      },
    });
  }

  const inputs = fieldNames
    .map((name) => {
      const isLong = name.toLowerCase().includes("message") || name.toLowerCase().includes("body");
      const label = name.replace(/[_-]/g, " ");
      if (isLong) {
        return `
          <label>
            <span>${escapeHtml(label)}</span>
            <textarea name="${escapeHtml(name)}" rows="4" required></textarea>
          </label>`;
      }
      const type = name.toLowerCase().includes("email") ? "email" : "text";
      return `
        <label>
          <span>${escapeHtml(label)}</span>
          <input type="${type}" name="${escapeHtml(name)}" required />
        </label>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · FlowForge</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center;
      background: #0b1020; color: #e8eefc; padding: 1.5rem; }
    form { width: min(420px, 100%); background: #121a33; border: 1px solid #243056;
      border-radius: 16px; padding: 1.5rem; box-shadow: 0 20px 50px rgba(0,0,0,.35); }
    h1 { font-size: 1.25rem; margin: 0 0 .35rem; }
    p.desc { color: #9bb0d3; font-size: .9rem; margin: 0 0 1.25rem; }
    label { display: block; margin-bottom: .9rem; }
    label span { display: block; font-size: .8rem; color: #9bb0d3; margin-bottom: .35rem; text-transform: capitalize; }
    input, textarea { width: 100%; box-sizing: border-box; border-radius: 10px;
      border: 1px solid #2d3d6b; background: #0b1328; color: #e8eefc; padding: .65rem .75rem; }
    button { width: 100%; border: 0; border-radius: 10px; padding: .75rem 1rem;
      background: linear-gradient(135deg, #22d3ee, #6366f1); color: #061018; font-weight: 700; cursor: pointer; }
    button:hover { filter: brightness(1.05); }
    .ok { display:none; text-align:center; color: #6ee7b7; }
    .err { display:none; text-align:center; color: #fca5a5; margin-top: .75rem; font-size: .9rem; }
    footer { margin-top: 1rem; text-align: center; font-size: .75rem; color: #6b7fa6; }
    .hp { position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden; }
  </style>
</head>
<body>
  <form id="ff-form" method="POST" action="">
    <h1>${escapeHtml(title)}</h1>
    ${description ? `<p class="desc">${escapeHtml(description)}</p>` : ""}
    <div class="hp" aria-hidden="true">
      <label>Company website<input type="text" name="_hp" tabindex="-1" autocomplete="off" /></label>
    </div>
    ${inputs}
    <button type="submit">Submit</button>
    <p class="err" id="err"></p>
    <p class="ok" id="ok">${escapeHtml(successMessage)}</p>
    <footer>Powered by FlowForge</footer>
  </form>
  <script>
    const form = document.getElementById('ff-form');
    const ok = document.getElementById('ok');
    const err = document.getElementById('err');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.style.display = 'none';
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch(window.location.pathname, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          err.textContent = json.error || 'Submission failed';
          err.style.display = 'block';
          return;
        }
        form.querySelectorAll('label, button').forEach(el => el.style.display = 'none');
        ok.style.display = 'block';
      } catch (e) {
        err.textContent = 'Network error';
        err.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; zapId: string }> }
) {
  const { userId, zapId } = await params;
  console.log(`[Form] Submission for user ${userId}, zap ${zapId}`);

  try {
    const result = await loadFormZap(userId, zapId);
    if ("error" in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { zap } = result;
    if (!zap.isActive) {
      return NextResponse.json(
        { success: false, error: "Zap is disabled" },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown> = {};

    if (contentType.includes("application/json")) {
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        body = {};
      }
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        body[key] = typeof value === "string" ? value : value.name;
      });
    } else {
      // Fallback: try JSON then empty
      try {
        body = (await req.json()) as Record<string, unknown>;
      } catch {
        body = {};
      }
    }

    // Honeypot: bots fill _hp — pretend success, do not run zap
    const hp = body._hp;
    if (typeof hp === "string" && hp.trim().length > 0) {
      console.log("[Form] Honeypot triggered — dropping submission");
      return NextResponse.json({
        success: true,
        message: "Form submitted",
        dropped: true,
      });
    }
    delete body._hp;

    const run = await createRunAndEnqueue(
      zap.id,
      zap.maxRuns,
      zap._count.ZapRuns,
      body
    );

    if ("response" in run && run.response) {
      return run.response;
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted",
      zapRunId: run.zapRun!.id,
    });
  } catch (error) {
    console.error("[Form] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
