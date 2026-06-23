import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

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
    baseURL: process.env.BASE_URL || "https://staging.visionsamur.ai",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
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
