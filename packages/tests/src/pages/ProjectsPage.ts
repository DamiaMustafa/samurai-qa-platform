import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ProjectsPage — project listing, search, filter, card interactions.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 * - Root:         <div id="projects-list-page" class="projects">
 * - Search:       <sc-search id="projects-quick-search">
 * - Filter:       <sc-nested-menu id="projects-filter-menu">
 * - Create btn:   <button id="projects-create-new-project-button" tw-button="green relaxed">
 * - Card listing: <sc-project-cards-listing>
 * - Card:         <sc-project-card> with [data] input
 * - Card open:    <button id="projects-open-project-page-{safeId}">
 * - Card menu:    <sc-submenu> per card
 * - Pagination:   <sc-pagination id="projects-list-pagination">
 * - Empty state:  <div class="projects__zero"> with empty-folder.png
 * - Loading:      <mat-spinner class="loading-spinner" diameter="30">
 */
export class ProjectsPage extends BasePage {
  // ── Selectors ─────────────────────────────────────────────────────────────

  private readonly root = "#projects-list-page";
  private readonly searchInput = "#projects-quick-search";
  private readonly filterMenu = "#projects-filter-menu";
  private readonly createButton = "#projects-create-new-project-button";
  private readonly cardListing = "sc-project-cards-listing";
  private readonly projectCards = "sc-project-card";
  private readonly pagination = "#projects-list-pagination";
  private readonly loadingSpinner = ".loading-spinner, mat-spinner";
  private readonly emptyState = ".projects__zero";
  private readonly emptyStateCreateButton = "#projects-zero-create-new-project-button";
  private readonly emptyStateHeading = ".projects__zero-header";
  private readonly emptyStateDescription = ".projects__zero-description";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/projects");
    await this.waitForReady();
  }

  // ── Page Load ───────────────────────────────────────────────────────────

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async waitForLoadingComplete(): Promise<void> {
    // Wait for spinner to disappear
    const spinner = this.page.locator(this.loadingSpinner).first();
    if (await spinner.isVisible().catch(() => false)) {
      await spinner.waitFor({ state: "hidden", timeout: 30000 }).catch(() => {});
    }
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async isSearchVisible(): Promise<boolean> {
    return this.page.locator(this.searchInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async searchProjects(query: string): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input`).first();
    await input.click();
    await input.fill(query);
    // Wait for client-side filter to apply
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input`).first();
    await input.clear();
    await this.page.waitForTimeout(500);
  }

  // ── Filter ──────────────────────────────────────────────────────────────

  async isFilterMenuVisible(): Promise<boolean> {
    return this.page.locator(this.filterMenu).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ── Create Project ──────────────────────────────────────────────────────

  async isCreateButtonVisible(): Promise<boolean> {
    return this.page.locator(this.createButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickCreateProject(): Promise<void> {
    await this.page.locator(this.createButton).first().click();
  }

  async expectCreateProjectNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/project-creation/, { timeout: 15000 });
  }

  // ── Project Cards ───────────────────────────────────────────────────────

  async getProjectCardCount(): Promise<number> {
    await this.waitForLoadingComplete();
    return this.page.locator(this.projectCards).count();
  }

  async hasProjectCards(): Promise<boolean> {
    const count = await this.getProjectCardCount();
    return count > 0;
  }

  async getProjectCardName(index: number): Promise<string> {
    const cards = this.page.locator(this.projectCards);
    const card = cards.nth(index);
    // Project name is in the card — look for the title element
    const name = card.locator('[id*="project-card-title"], .card__details-title, h3, h4, strong').first();
    return ((await name.textContent()) || "").trim();
  }

  async isOpenProjectButtonVisible(index: number): Promise<boolean> {
    const cards = this.page.locator(this.projectCards);
    const card = cards.nth(index);
    const btn = card.locator('button[id*="open-project-page"], button:has-text("Open Project"), button:has-text("Open")').first();
    return btn.isVisible().catch(() => false);
  }

  async clickOpenProject(index: number): Promise<void> {
    const cards = this.page.locator(this.projectCards);
    const card = cards.nth(index);
    const btn = card.locator('button[id*="open-project-page"], button:has-text("Open Project"), button:has-text("Open")').first();
    await btn.click();
  }

  async expectProjectNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/\/project\/[a-f0-9-]+\/overview/, { timeout: 15000 });
  }

  // ── Card Kebab Menu ─────────────────────────────────────────────────────

  async openCardMenu(index: number): Promise<void> {
    const cards = this.page.locator(this.projectCards);
    const card = cards.nth(index);
    // The submenu trigger button (⋮ icon)
    const trigger = card.locator('sc-submenu, [class*="submenu"], button[aria-haspopup]').first();
    await trigger.click();
    // Wait for menu to appear
    await this.page.locator('[role="menu"], .mat-mdc-menu-panel, .cdk-overlay-pane').first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async getCardMenuItems(): Promise<string[]> {
    const items = this.page.locator(
      '[role="menu"] [role="menuitem"], .mat-mdc-menu-panel button, .cdk-overlay-pane [role="menuitem"]'
    );
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await items.nth(i).textContent()) || "").trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async clickCardMenuItem(itemText: string): Promise<void> {
    const item = this.page
      .locator('[role="menuitem"], .mat-mdc-menu-panel button')
      .filter({ hasText: new RegExp(itemText, "i") })
      .first();
    await item.click();
  }

  // ── Pagination ──────────────────────────────────────────────────────────

  async isPaginationVisible(): Promise<boolean> {
    return this.page.locator(this.pagination).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickNextPage(): Promise<void> {
    const next = this.page.locator(`${this.pagination} button`).last();
    await next.click();
    await this.waitForLoadingComplete();
  }

  async clickPreviousPage(): Promise<void> {
    const prev = this.page.locator(`${this.pagination} button`).first();
    await prev.click();
    await this.waitForLoadingComplete();
  }

  // ── Empty State ─────────────────────────────────────────────────────────

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getEmptyStateHeading(): Promise<string> {
    return ((await this.page.locator(this.emptyStateHeading).first().textContent()) || "").trim();
  }

  async isCreateButtonInEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyStateCreateButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickCreateFromEmptyState(): Promise<void> {
    await this.page.locator(this.emptyStateCreateButton).first().click();
  }

  // ── Interactions ────────────────────────────────────────────────────────

  async clickOutside(): Promise<void> {
    await this.page.locator(this.root).click({ position: { x: 10, y: 10 } });
  }
}
