import type { Page, TestInfo } from "@playwright/test";
import path from "path";
import fs from "fs";

/**
 * Generate a timestamped folder name once per test run.
 * Format: run-YYYY-MM-DD_HH-MM-SS
 */
const RUN_TIMESTAMP = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .substring(0, 19);

const RUN_DIR = path.resolve(__dirname, `../../test-screenshots/${RUN_TIMESTAMP}`);

/**
 * Sanitize a string for use as a filename.
 */
function sanitize(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 100);
}

/**
 * Takes a full-page screenshot after each test with human-readable naming.
 * Format: [PASS] describe-block - test-name.png  or  [FAIL] describe-block - test-name.png
 *
 * Each run gets its own timestamped folder:
 *   test-screenshots/run-2026-06-24_14-30-00/
 */
export async function takeResultScreenshot(
  page: Page,
  testInfo: TestInfo
): Promise<void> {
  const status = testInfo.status ?? "unknown";
  const prefix =
    status === "passed"
      ? "PASS"
      : status === "failed"
        ? "FAIL"
        : status.toUpperCase();

  // Build readable name from test title path
  const describeBlock =
    testInfo.titlePath.length > 1
      ? testInfo.titlePath[testInfo.titlePath.length - 2]
      : "unknown";
  const testName = testInfo.title;
  const fileName = `[${prefix}] ${sanitize(describeBlock)} - ${sanitize(testName)}.png`;
  const filePath = path.join(RUN_DIR, fileName);

  // Ensure run directory exists
  if (!fs.existsSync(RUN_DIR)) {
    fs.mkdirSync(RUN_DIR, { recursive: true });
  }

  try {
    const buffer = await page.screenshot({ fullPage: true });
    fs.writeFileSync(filePath, buffer);
  } catch {
    // Page may be closed already — skip silently
  }
}
