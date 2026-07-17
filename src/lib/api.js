/* ==================================================================
 * Health-status API client.
 *
 * Endpoint (per environment, via env vars):
 *   GET  {VITE_API_BASE_URL}{VITE_HEALTH_STATUS_PATH}
 *   e.g. https://dristi-kerala-dev.pucar.org/health-dashboard/v1/services/status
 *
 * VITE_API_BASE_URL empty  → same-origin relative request (recommended).
 * Local dev proxies the path prefix to VITE_DEV_API_TARGET (see vite.config.js).
 *
 * Response shape (array):
 *   { id, serviceName, serviceUrl, lastStatus, lastUpdatedTime, responseTimeMs, message }
 * ================================================================== */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const STATUS_PATH =
  import.meta.env.VITE_HEALTH_STATUS_PATH ||
  "/health-dashboard/v1/services/status";

export const HEALTH_STATUS_URL = `${API_BASE}${STATUS_PATH}`;

/* How often the UI re-fetches the status while the page is open.
 * Default 5 minutes; override per environment with VITE_REFRESH_INTERVAL_MS.
 * Set to 0 to disable polling (fetch only on load). */
export const REFRESH_INTERVAL_MS =
  Number(import.meta.env.VITE_REFRESH_INTERVAL_MS ?? 3 * 60 * 1000) || 0;

/* Fetch the raw service-status array. Throws on network / HTTP / shape errors;
 * callers decide how to surface it (see App.jsx). `signal` supports abort. */
export async function fetchServiceStatus(signal) {
  const res = await fetch(HEALTH_STATUS_URL, {
    method: "GET",
    headers: { accept: "application/json, text/plain, */*" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Health API responded ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected health API response (expected an array).");
  }
  return data;
}
