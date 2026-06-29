import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig({ path: path.resolve(__dirname, ".env") });

// ── Multi-env resolution ────────────────────────────────
const env = (process.env.ACTIVE_ENV || "staging").toUpperCase();

const BASE_URL =
  process.env.BASE_URL ||
  process.env[`${env}_BASE_URL`] ||
  "https://staging.visionsamur.ai";

const TEST_EMAIL =
  process.env.TEST_EMAIL || process.env[`${env}_EMAIL`] || "";

const TEST_PASSWORD =
  process.env.TEST_PASSWORD || process.env[`${env}_PASSWORD`] || "";

// Expose resolved values so environments.ts can reuse them
process.env.BASE_URL = BASE_URL;
process.env.TEST_EMAIL = TEST_EMAIL;
process.env.TEST_PASSWORD = TEST_PASSWORD;

export default defineConfig({
  testDir: "./tests",
  timeout: parseInt(process.env.TEST_TIMEOUT || "60000", 10),
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI
    ? 2
    : parseInt(process.env.TEST_RETRIES || "0", 10),
  workers: parseInt(process.env.TEST_WORKERS || "1", 10),
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
    ["./src/reporters/dashboard-reporter.ts"],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "off",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
