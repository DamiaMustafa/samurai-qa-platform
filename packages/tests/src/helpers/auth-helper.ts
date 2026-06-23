import { type Page } from "@playwright/test";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Auth helper — manages session storage state for login reuse.
 */

const STORAGE_DIR = path.join(__dirname, "../../.auth");

export async function saveStorageState(page: Page, name: string = "admin"): Promise<string> {
  await mkdir(STORAGE_DIR, { recursive: true });
  const filePath = path.join(STORAGE_DIR, `${name}.json`);
  await page.context().storageState({ path: filePath });
  return filePath;
}

export async function getStorageStatePath(name: string = "admin"): Promise<string> {
  return path.join(STORAGE_DIR, `${name}.json`);
}

export async function clearStorageState(): Promise<void> {
  const { rm } = await import("fs/promises");
  try {
    await rm(STORAGE_DIR, { recursive: true, force: true });
  } catch {
    // Directory may not exist yet
  }
}
