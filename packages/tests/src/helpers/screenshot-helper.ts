import { type TestInfo, type Page } from "@playwright/test";
import { mkdir } from "fs/promises";
import path from "path";

/**
 * Screenshot helper — captures and attaches screenshots to test reports.
 */

const SCREENSHOT_DIR = path.join(__dirname, "../../screenshots");

export async function captureScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
  fullPage: boolean = true
): Promise<string> {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const fileName = `${name}-${Date.now()}.png`;
  const filePath = path.join(SCREENSHOT_DIR, fileName);

  await page.screenshot({ path: filePath, fullPage });

  // Attach to test report
  await testInfo.attach(name, {
    path: filePath,
    contentType: "image/png",
  });

  return filePath;
}

export async function captureElementScreenshot(
  page: Page,
  testInfo: TestInfo,
  selector: string,
  name: string
): Promise<string> {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const fileName = `${name}-${Date.now()}.png`;
  const filePath = path.join(SCREENSHOT_DIR, fileName);

  await page.locator(selector).screenshot({ path: filePath });

  await testInfo.attach(name, {
    path: filePath,
    contentType: "image/png",
  });

  return filePath;
}

export async function captureOnFailure(
  page: Page,
  testInfo: TestInfo
): Promise<void> {
  if (testInfo.status !== testInfo.expectedStatus) {
    await captureScreenshot(page, testInfo, "failure-screenshot");
  }
}
