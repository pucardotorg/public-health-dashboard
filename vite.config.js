import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* In production the app is served from a sub-path on the landing-page host
 * (https://oncourts.kerala.gov.in/public-health-dashboard/), so the build must
 * prefix every asset URL with that path. Dev keeps "/" for convenience;
 * `npm run preview` uses the real base so you can verify the prod path locally. */
const BASE_PATH = "/public-health-dashboard/";

export default defineConfig(({ command, mode }) => {
  // Load .env, .env.<mode>, .env.local … so we can read them here in config.
  const env = loadEnv(mode, process.cwd(), "");
  const devApiTarget = env.VITE_DEV_API_TARGET || "https://dristi-kerala-dev.pucar.org";
  const statusPath = env.VITE_HEALTH_STATUS_PATH || "/health-dashboard/v1/services/status";
  // Proxy the API's mount prefix (everything up to /v1) during local dev.
  const proxyPrefix = statusPath.split("/v1")[0] || "/health-dashboard";

  return {
    base: command === "build" ? BASE_PATH : "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Local dev only: forward same-origin /health-dashboard/* calls to the dev
    // backend so the browser never makes a cross-origin request (no CORS).
    // Ignored by `vite build` — production uses same-origin / VITE_API_BASE_URL.
    server: {
      proxy: {
        [proxyPrefix]: {
          target: devApiTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
