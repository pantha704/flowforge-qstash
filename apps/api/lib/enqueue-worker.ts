import { workerAuthHeaders } from "./security";
import { getAppUrl } from "./app-url";

/**
 * Fire the worker for a ZapRun.
 * Uses WORKER_SECRET when configured; never throws on network errors (caller logs).
 */
export async function enqueueWorker(
  zapRunId: string
): Promise<{ ok: boolean; status?: number; url?: string }> {
  const appUrl = getAppUrl();
  const url = `${appUrl}/api/worker`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: workerAuthHeaders(),
      body: JSON.stringify({ zapRunId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[enqueueWorker] ${url} → ${res.status} ${text.slice(0, 200)}`
      );
    }
    return { ok: res.ok, status: res.status, url };
  } catch (error) {
    console.error(`[enqueueWorker] Failed to call ${url}:`, error);
    return { ok: false, url };
  }
}
