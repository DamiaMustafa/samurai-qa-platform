import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ApiKeysPage — API key listing, creation, and management.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 * - Root:         <div id="api-keys-list-page" class="api-keys">
 * - Search:       <sc-search id="api-keys-search" theme="gray">
 * - Create btn:   <button id="api-keys-create-new-key" tw-button="green relaxed">
 * - Table:        <sc-table id="api-keys-table">
 * - Empty state:  <div id="api-keys-empty-state">
 * - Pagination:   <sc-full-pagination id="api-keys-list-pagination">
 * - Row actions:  sc-submenu with edit/activate/revoke/delete
 *
 * Create page:
 * - Root:         <div id="api-keys-create-page" class="add-key">
 * - Back:         <button id="api-keys-create-back">
 * - Name input:   <sc-input id="api-keys-create-name-input">
 * - Submit:       <button id="api-keys-create-submit">
 * - Success:      <div id="api-keys-create-success">
 * - Key value:    <span id="api-keys-created-key-value">
 * - Copy:         <img id="api-keys-created-key-copy">
 * - Back to list: <button id="api-keys-back-to-list">
 */
export class ApiKeysPage extends BasePage {
  private readonly root = "#api-keys-list-page";
  private readonly searchInput = "#api-keys-search";
  private readonly createButton = "#api-keys-create-new-key";
  private readonly table = "#api-keys-table";
  private readonly emptyState = "#api-keys-empty-state";
  private readonly emptyCreateButton = "#api-keys-empty-create-new-key";
  private readonly pagination = "#api-keys-list-pagination";
  private readonly rowActions = "sc-submenu, [class*='submenu']";

  // Create page selectors
  private readonly createRoot = "#api-keys-create-page";
  private readonly createBack = "#api-keys-create-back";
  private readonly createNameInput = "#api-keys-create-name-input";
  private readonly createSubmit = "#api-keys-create-submit";
  private readonly createSuccess = "#api-keys-create-success";
  private readonly createdKeyValue = "#api-keys-created-key-value";
  private readonly createdKeyCopy = "#api-keys-created-key-copy";
  private readonly backToList = "#api-keys-back-to-list";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/api-keys");
    await this.waitForReady();
  }

  async gotoCreate(): Promise<void> {
    await this.navigate("/api-keys/create");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async isSearchVisible(): Promise<boolean> {
    return this.page.locator(this.searchInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async searchKeys(query: string): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input`).first();
    await input.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input`).first();
    await input.clear();
    await this.page.waitForTimeout(500);
  }

  // ── Create Button ───────────────────────────────────────────────────────

  async isCreateButtonVisible(): Promise<boolean> {
    return this.page.locator(this.createButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickCreateNewKey(): Promise<void> {
    await this.page.locator(this.createButton).first().click();
  }

  async expectCreateNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/api-keys\/create/, { timeout: 15000 });
  }

  // ── Table ───────────────────────────────────────────────────────────────

  async isTableVisible(): Promise<boolean> {
    return this.page.locator(this.table).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getTableRowCount(): Promise<number> {
    // sc-table renders header in <thead> and data in <tbody>
    // Count only tbody rows to exclude the header row
    const tbodyRows = this.page.locator(`${this.table} tbody tr`);
    const count = await tbodyRows.count();
    if (count > 0) return count;
    // Fallback: count data-row elements (non-table layouts)
    return this.page.locator(`${this.table} [class*="data-row"], ${this.table} tbody [class*="row"]`).count();
  }

  // ── Empty State ─────────────────────────────────────────────────────────

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isCreateButtonInEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyCreateButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ── Row Actions ─────────────────────────────────────────────────────────

  async openRowMenu(index: number): Promise<void> {
    const menus = this.page.locator(`${this.table} ${this.rowActions}`);
    await menus.nth(index).click();
    await this.page.locator('[role="menu"], .mat-mdc-menu-panel, .cdk-overlay-pane').first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async getRowMenuItems(): Promise<string[]> {
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

  async clickRowMenuItem(itemText: string): Promise<void> {
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

  // ── Create Page ─────────────────────────────────────────────────────────

  async isCreatePageLoaded(): Promise<boolean> {
    return this.page.locator(this.createRoot).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async isNameInputVisible(): Promise<boolean> {
    return this.page.locator(this.createNameInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async fillKeyName(name: string): Promise<void> {
    const input = this.page.locator(`${this.createNameInput} input`).first();
    await input.fill(name);
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return this.page.locator(this.createSubmit).first().isDisabled().catch(() => true);
  }

  async clickSubmit(): Promise<void> {
    await this.page.locator(this.createSubmit).first().click();
  }

  async isSuccessVisible(): Promise<boolean> {
    return this.page.locator(this.createSuccess).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async getCreatedKeyValue(): Promise<string> {
    return ((await this.page.locator(this.createdKeyValue).first().textContent()) || "").trim();
  }

  async clickCopyKey(): Promise<void> {
    await this.page.locator(this.createdKeyCopy).first().click();
  }

  async clickBackToList(): Promise<void> {
    await this.page.locator(this.backToList).first().click();
  }

  async clickCreateBack(): Promise<void> {
    await this.page.locator(this.createBack).first().click();
  }
}
