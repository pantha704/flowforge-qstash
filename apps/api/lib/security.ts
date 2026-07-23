import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/** timing-safe string compare; length mismatch → false */
function timingSafeStringEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Optional worker auth.
 * - If WORKER_SECRET is unset/empty → open mode (backward compatible).
 * - If set → require matching x-worker-secret header.
 */
export function assertWorkerAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.WORKER_SECRET?.trim();
  if (!secret) return null;

  const header = req.headers.get("x-worker-secret") ?? "";
  if (!timingSafeStringEqual(header, secret)) {
    console.warn("[Security] Worker auth failed — missing or invalid x-worker-secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Headers to attach when calling /api/worker from hooks/cron/forms. */
export function workerAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const secret = process.env.WORKER_SECRET?.trim();
  if (secret) {
    headers["x-worker-secret"] = secret;
  }
  return headers;
}

/**
 * Optional webhook HMAC verification (HMAC-SHA256).
 * Accepted headers: x-flowforge-signature, x-signature
 * Accepted formats: "<hex>", "sha256=<hex>"
 *
 * If secret is empty → skip (backward compatible).
 * Returns null if OK, or an error NextResponse.
 */
export function assertWebhookSignature(
  rawBody: string,
  secret: string | undefined | null,
  req: NextRequest
): NextResponse | null {
  const trimmed = secret?.trim();
  if (!trimmed) return null;

  const header =
    req.headers.get("x-flowforge-signature") ||
    req.headers.get("x-signature") ||
    "";

  if (!header) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing webhook signature",
        hint: "Send HMAC-SHA256 hex in x-flowforge-signature (or sha256=<hex>)",
      },
      { status: 401 }
    );
  }

  const provided = header.startsWith("sha256=") ? header.slice(7) : header;
  const expected = createHmac("sha256", trimmed).update(rawBody, "utf8").digest("hex");

  if (!timingSafeStringEqual(provided, expected)) {
    console.warn("[Security] Webhook signature mismatch");
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  return null;
}
