import { defineConfig, devices } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Chromium: CHROMIUM_PATH, else installed Chrome/Edge on Windows, else the cloud image (PLAYWRIGHT_BROWSERS_PATH, default /opt/pw-browsers).
function chromiumPath(): string | undefined {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  // Windows: use the installed Chrome or Edge, no `playwright install` needed
  for (const p of ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"]) {
    if (process.platform === "win32" && existsSync(p)) return p;
  }
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  if (!existsSync(root)) return undefined;
  const dirs = readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) {
    const p = join(root, d, "chrome-linux", "chrome");
    if (existsSync(p)) return p;
  }
  return undefined;
}

const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`,
    launchOptions: { executablePath: chromiumPath(), args: ["--no-sandbox"] },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } }],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: `npm start -- -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: true, timeout: 60_000 },
});
