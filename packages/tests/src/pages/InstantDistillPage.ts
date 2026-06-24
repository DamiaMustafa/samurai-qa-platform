import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * InstantDistillPage — Instant Distill listing, create, build, integrate.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 * - List root:    <div id="instant-distill-list-page" class="instant-distill">
 * - Create btn:   <button id="instant-distill-create-button" tw-button="green relaxed">
 * - Cards:        <sc-instant-distill-card> per project
 * - Empty state:  <div class="instant-distill__zero">
 * - Pagination:   <sc-pagination id="instant-distill-list-pagination">
 * - Search:       <sc-search id="instant-distill-search">
 */
export class InstantDistillPage extends BasePage {
  private readonly listRoot = "#instant-distill-list-page, .instant-distill";
  private readonly createButton = "#instant-distill-create-button, button:has-text('Create')";
  private readonly cards = "sc-instant-distill-card, [class*='distill-card']";
  private readonly emptyState = ".instant-distill__zero, [class*='zero']";
  private readonly pagination = "#instant-distill-list-pagination";
  private readonly searchInput = "#instant-distill-search";

  // Create page
  private readonly createRoot = "#instant-distill-create-page, .create-distill";
  private readonly createNameInput = "#instant-distill-create-name-input, [class*='create'] input";
  private readonly createSubmit = "#instant-distill-create-submit, button:has-text('Create')";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/instant-distill");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(".instant-distill, #instant-distill-list-page").first()
      .isVisible({ timeout: 10000 }).catch(() => false);
  }

  // ── List Page ───────────────────────────────────────────────────────────

  async isSearchVisible(): Promise<boolean> {
    return this.page.locator(this.searchInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isCreateButtonVisible(): Promise<boolean> {
    const btn = this.page.locator('button[id*="instant-distill-create"], button:has-text("Create")').first();
    return btn.isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickCreate(): Promise<void> {
    const btn = this.page.locator('button[id*="instant-distill-create"], button:has-text("Create")').first();
    await btn.click();
  }

  async expectCreateNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/instant-distill\/create/, { timeout: 15000 });
  }

  // ── Cards ───────────────────────────────────────────────────────────────

  async getCardCount(): Promise<number> {
    return this.page.locator(this.cards).count();
  }

  async hasCards(): Promise<boolean> {
    return (await this.getCardCount()) > 0;
  }

  // ── Empty State ─────────────────────────────────────────────────────────

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ── Pagination ──────────────────────────────────────────────────────────

  async isPaginationVisible(): Promise<boolean> {
    return this.page.locator(this.pagination).first().isVisible({ timeout: 5000 }).catch(() => false);
  }
}
