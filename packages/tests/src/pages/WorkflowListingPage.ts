import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * WorkflowListingPage — workflow listing, cards, create, rename, delete,
 * search, and pagination.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 *
 * Listing page (/workflow-listing):
 * - Root:       <div id="workflow-listing-page" class="workflow-listing">
 * - Actions:    <div id="workflow-listing-actions">
 * - Search:     <sc-search id="workflow-listing-search" theme="gray">
 * - Create:     <button id="workflow-listing-create-button">
 * - List:       <div id="workflow-listing-list">
 * - Pagination: <sc-pagination id="workflow-listing-pagination">
 *
 * Workflow Card (dynamic IDs):
 * - Root:    <div id="workflow-card-{id}">
 * - Title:   <span id="workflow-card-title-{id}">
 * - Menu:    <sc-submenu id="workflow-card-menu-{id}">
 * - Rename:  <span id="workflow-card-menu-rename-{id}">
 * - Delete:  <span id="workflow-card-menu-delete-{id}">
 *
 * Create Dialog:
 * - Root:    #workflow-create-dialog
 * - Confirm: #workflow-create-dialog-confirm-button
 * - Cancel:  #workflow-create-dialog-cancel-button
 *
 * Rename Dialog:
 * - Root:    #workflow-rename-dialog
 * - Confirm: #workflow-rename-dialog-confirm-button
 * - Cancel:  #workflow-rename-dialog-cancel-button
 */
export class WorkflowListingPage extends BasePage {
  // ── Page Root ──────────────────────────────────────────────────────────────
  private readonly root = "#workflow-listing-page";
  private readonly actions = "#workflow-listing-actions";

  // ── Search ─────────────────────────────────────────────────────────────────
  private readonly searchInput = "#workflow-listing-search";
  private readonly searchInputField = "#workflow-listing-search-input, #workflow-listing-search input";

  // ── Create ─────────────────────────────────────────────────────────────────
  private readonly createButton = "#workflow-listing-create-button";

  // ── Cards ──────────────────────────────────────────────────────────────────
  private readonly cards = "workflow-card, [class*='workflow-card']";
  private readonly cardList = "#workflow-listing-list";

  // ── Pagination ─────────────────────────────────────────────────────────────
  private readonly pagination = "#workflow-listing-pagination";
  private readonly paginationPrev = "#workflow-listing-pagination-prev";
  private readonly paginationNext = "#workflow-listing-pagination-next";

  // ── Create Dialog ──────────────────────────────────────────────────────────
  private readonly createDialog = "#workflow-create-dialog";
  private readonly createConfirmButton = "#workflow-create-dialog-confirm-button";
  private readonly createCancelButton = "#workflow-create-dialog-cancel-button";

  // ── Rename Dialog ──────────────────────────────────────────────────────────
  private readonly renameDialog = "#workflow-rename-dialog";
  private readonly renameConfirmButton = "#workflow-rename-dialog-confirm-button";
  private readonly renameCancelButton = "#workflow-rename-dialog-cancel-button";

  // ── Generic Dialog ─────────────────────────────────────────────────────────
  private readonly genericDialog = ".dialog, mat-dialog-container, [class*='form-dialog']";
  private readonly dialogInput = ".dialog input, mat-dialog-container input, [class*='form-dialog'] input";

  // ── Card Menu ──────────────────────────────────────────────────────────────
  private readonly menuPanel = '[role="menu"], .mat-mdc-menu-panel, [class*="submenu-panel"]';

  constructor(page: Page) {
    super(page);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Navigation
  // ════════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await this.navigate("/workflow-listing");
    await this.waitForReady();
    // Give Angular extra time to settle: the TwLayoutComponent loading
    // overlay (tw-layout__main-content-invisible) may briefly hide the
    // content while the translate service resolves initial strings.
    await this.page.waitForTimeout(2_000);
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Search
  // ════════════════════════════════════════════════════════════════════════════

  async isSearchVisible(): Promise<boolean> {
    return this.page
      .locator(this.searchInput)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async searchWorkflows(query: string): Promise<void> {
    const input = this.page.locator(this.searchInputField).first();
    await input.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(this.searchInputField).first();
    await input.clear();
    await this.page.waitForTimeout(500);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Create
  // ════════════════════════════════════════════════════════════════════════════

  async isCreateButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.createButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickCreateWorkflow(): Promise<void> {
    await this.page.locator(this.createButton).first().click();
  }

  async isCreateDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.createDialog)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async fillCreateDialogName(name: string): Promise<void> {
    const input = this.page.locator(this.dialogInput).first();
    await input.fill(name);
  }

  async clickCreateConfirm(): Promise<void> {
    await this.page.locator(this.createConfirmButton).first().click();
  }

  async clickCreateCancel(): Promise<void> {
    await this.page.locator(this.createCancelButton).first().click();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Cards
  // ════════════════════════════════════════════════════════════════════════════

  async getCardCount(): Promise<number> {
    return this.page.locator(this.cards).count();
  }

  async hasCards(): Promise<boolean> {
    return (await this.getCardCount()) > 0;
  }

  async getCardTitle(index: number): Promise<string> {
    const card = this.page.locator(this.cards).nth(index);
    const title = card
      .locator('[id*="workflow-card-title"], [class*="title"], h3, h4')
      .first();
    return ((await title.textContent()) || "").trim();
  }

  async clickCard(index: number): Promise<void> {
    const card = this.page.locator(this.cards).nth(index);
    await card.click();
  }

  async expectWorkflowNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/\/workflow\//, { timeout: 15_000 });
  }

  // ── Card Menu ────────────────────────────────────────────────────────────────

  async openCardMenu(index: number): Promise<void> {
    const card = this.page.locator(this.cards).nth(index);
    const menu = card
      .locator(
        'sc-submenu, [class*="submenu"], button[aria-haspopup]'
      )
      .first();
    await menu.click();
    await this.page
      .locator(this.menuPanel)
      .first()
      .waitFor({ state: "visible", timeout: 5_000 });
  }

  async isMenuPanelVisible(): Promise<boolean> {
    return this.page
      .locator(this.menuPanel)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getCardMenuItems(): Promise<string[]> {
    const items = this.page.locator(
      '[role="menu"] [role="menuitem"], .mat-mdc-menu-panel button, [class*="submenu"] [class*="option"]'
    );
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await items.nth(i).textContent()) || "").trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async clickMenuRename(): Promise<void> {
    const item = this.page
      .locator(
        '[id*="workflow-card-menu-rename"], [role="menuitem"]:has-text("Rename"), [class*="submenu"] [class*="option"]:has-text("Rename")'
      )
      .first();
    await item.click();
  }

  async clickMenuDelete(): Promise<void> {
    const item = this.page
      .locator(
        '[id*="workflow-card-menu-delete"], [role="menuitem"]:has-text("Delete"), [class*="submenu"] [class*="option"]:has-text("Delete")'
      )
      .first();
    await item.click();
  }

  // ── Rename Dialog ────────────────────────────────────────────────────────────

  async isRenameDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.renameDialog)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async fillRenameDialogName(name: string): Promise<void> {
    const input = this.page.locator(this.dialogInput).first();
    await input.clear();
    await input.fill(name);
  }

  async clickRenameConfirm(): Promise<void> {
    await this.page.locator(this.renameConfirmButton).first().click();
  }

  async clickRenameCancel(): Promise<void> {
    await this.page.locator(this.renameCancelButton).first().click();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Pagination
  // ════════════════════════════════════════════════════════════════════════════

  async isPaginationVisible(): Promise<boolean> {
    return this.page
      .locator(this.pagination)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickNextPage(): Promise<void> {
    await this.page.locator(this.paginationNext).click();
    await this.waitForReady();
  }

  async clickPrevPage(): Promise<void> {
    await this.page.locator(this.paginationPrev).click();
    await this.waitForReady();
  }

  async isNextPageDisabled(): Promise<boolean> {
    const btn = this.page.locator(this.paginationNext).first();
    const disabled = await btn.getAttribute("disabled");
    const ariaDisabled = await btn.getAttribute("aria-disabled");
    const cls = await btn.getAttribute("class") || "";
    return (
      disabled !== null ||
      ariaDisabled === "true" ||
      cls.includes("disabled")
    );
  }

  async isPrevPageDisabled(): Promise<boolean> {
    const btn = this.page.locator(this.paginationPrev).first();
    const disabled = await btn.getAttribute("disabled");
    const ariaDisabled = await btn.getAttribute("aria-disabled");
    const cls = await btn.getAttribute("class") || "";
    return (
      disabled !== null ||
      ariaDisabled === "true" ||
      cls.includes("disabled")
    );
  }
}
