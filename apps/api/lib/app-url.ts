/**
 * Base URL of this API (no trailing slash).
 *
 * Important: in local `next dev`, never call a remote APP_URL for the worker —
 * that would create ZapRuns in the local DB while executing on production.
 */
export function getAppUrl(): string {
  const fromEnv = (process.env.APP_URL || "").replace(/\/$/, "");

  // Deployed (Vercel) or NODE_ENV=production → trust APP_URL
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    return fromEnv || "http://localhost:3001";
  }

  // Local development: keep worker on the same machine as the DB
  if (process.env.LOCAL_APP_URL) {
    return process.env.LOCAL_APP_URL.replace(/\/$/, "");
  }

  const port = process.env.PORT || "3001";
  return `http://localhost:${port}`;
}
