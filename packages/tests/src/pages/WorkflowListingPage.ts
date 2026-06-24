import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * WorkflowListingPage — workflow listing, cards, create, search.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 * - Root:         <div id="workflow-listing-page" class="workflow-listing">
 * - Search:       <sc-search id="workflow-listing-search" theme="gray">
 * - Create btn:   <button id="workflow-listing-create-button" tw-button="relaxed primary-green">
 * - Cards:        <workflow-card> per workflow
 * - Pagination:   <sc-pagination id="workflow-listing-pagination">
 *
 * Workflow Card:
 * - Root:         <div id="workflow-card-{id}">
 * - Title:        <span id="workflow-card-title-{id}">
 * - Menu:         <sc-submenu id="workflow-card-menu-{id}">
 * - Rename:       <span id="workflow-card-menu-rename-{id}">
 * - Delete:       <span id="workflow-card-menu-delete-{id}">
 */
export class WorkflowListingPage extends BasePage {
  private readonly root = "#workflow-listing-page";
  private readonly searchInput = "#workflow-listing-search";
  private readonly createButton = "#workflow-listing-create-button";
  private readonly cards = "workflow-card, [class*='workflow-card']";
  private readonly pagination = "#workflow-listing-pagination";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/workflow-listing");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async isSearchVisible(): Promise<boolean> {
    return this.page.locator(this.searchInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async searchWorkflows(query: string): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input, #workflow-listing-search-input`).first();
    await input.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input, #workflow-listing-search-input`).first();
    await input.clear();
    await this.page.waitForTimeout(500);
  }

  // ── Create ──────────────────────────────────────────────────────────────

  async isCreateButtonVisible(): Promise<boolean> {
    return this.page.locator(this.createButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickCreateWorkflow(): Promise<void> {
    await this.page.locator(this.createButton).first().click();
  }

  // ── Cards ───────────────────────────────────────────────────────────────

  async getCardCount(): Promise<number> {
    return this.page.locator(this.cards).count();
  }

  async hasCards(): Promise<boolean> {
    return (await this.getCardCount()) > 0;
  }

  async getCardTitle(index: number): Promise<string> {
    const card = this.page.locator(this.cards).nth(index);
    const title = card.locator('[id*="workflow-card-title"], [class*="title"], h3, h4').first();
    return ((await title.textContent()) || "").trim();
  }

  async clickCard(index: number): Promise<void> {
    const card = this.page.locator(this.cards).nth(index);
    await card.click();
  }

  async expectWorkflowNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/\/workflow\/[a-f0-9-]+/, { timeout: 15000 });
  }

  // ── Card Menu ───────────────────────────────────────────────────────────

  async openCardMenu(index: number): Promise<void> {
    const card = this.page.locator(this.cards).nth(index);
    const menu = card.locator('sc-submenu, [class*="submenu"], button[aria-haspopup]').first();
    await menu.click();
    await this.page.locator('[role="menu"], .mat-mdc-menu-panel').first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async getCardMenuItems(): Promise<string[]> {
    const items = this.page.locator(
      '[role="menu"] [role="menuitem"], .mat-mdc-menu-panel button'
    );
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await items.nth(i).textContent()) || "").trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  // ── Pagination ──────────────────────────────────────────────────────────

  async isPaginationVisible(): Promise<boolean> {
    return this.page.locator(this.pagination).first().isVisible({ timeout: 5000 }).catch(() => false);
  }
}
