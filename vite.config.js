import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* In production the app is served from a sub-path on the landing-page host
 * (https://oncourts.kerala.gov.in/public-health-dashboard/), so the build must
 * prefix every asset URL with that path. Dev keeps "/" for convenience;
 * `npm run preview` uses the real base so you can verify the prod path locally. */
const BASE_PATH = "/public-health-dashboard/";

export default defineConfig(({ command }) => ({
  base: command === "build" ? BASE_PATH : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
