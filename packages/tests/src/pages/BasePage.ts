import { type Page, type Locator, expect } from "@playwright/test";

/**
 * BasePage — foundation for all Page Objects.
 * Provides common navigation, waiting, and screenshot utilities.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  // ── Navigation ──────────────────────────────────────────────────────────

  async navigate(path: string = ""): Promise<void> {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async navigateAndWait(path: string = ""): Promise<void> {
    await this.page.goto(path, { waitUntil: "networkidle" });
  }

  getUrl(): string {
    return this.page.url();
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  // ── Waiting ─────────────────────────────────────────────────────────────

  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  async waitForSelector(selector: string, timeout?: number): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: "visible", timeout });
    return locator;
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  // ── Interactions ────────────────────────────────────────────────────────

  async clickAndWait(selector: string): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState("networkidle"),
      this.page.locator(selector).click(),
    ]);
  }

  async fillField(selector: string, value: string): Promise<void> {
    const field = this.page.locator(selector);
    await field.clear();
    await field.fill(value);
  }

  async getText(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) || "";
  }

  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }

  // ── Screenshots ─────────────────────────────────────────────────────────

  async takeScreenshot(name: string, fullPage: boolean = true): Promise<Buffer> {
    return this.page.screenshot({ fullPage });
  }

  async takeElementScreenshot(selector: string): Promise<Buffer> {
    return this.page.locator(selector).screenshot();
  }

  // ── Assertions ──────────────────────────────────────────────────────────

  async expectUrlContains(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment));
  }

  async expectTitleContains(text: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(text));
  }

  async expectVisible(selector: string): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible();
  }
}
