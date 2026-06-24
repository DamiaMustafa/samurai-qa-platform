import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * EdgeManagementPage — edge device listing, license management.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 * - Root:         <div id="edge-management-page" class="edge-management">
 * - Add Server:   <button id="edge-management-add-server" tw-button="green relaxed">
 * - Search:       <sc-search id="edge-management-search">
 * - Table:        <sc-table id="edge-management-table">
 * - Pagination:   <sc-pagination id="edge-management-pagination">
 * - Row menu:     <sc-submenu> with Manage License / Delete
 *
 * License Dialog:
 * - Root:         <div id="edge-license-dialog">
 * - Close:        <button id="edge-license-dialog-close">
 * - License key:  <span id="edge-license-dialog-license-key">
 * - Download:     <button id="edge-license-dialog-download">
 * - Revoke:       <button id="edge-license-dialog-revoke">
 * - Generate:     <button id="edge-license-dialog-generate">
 * - No sources:   <sc-input id="edge-license-dialog-no-sources">
 * - Start date:   <sc-datePicker id="edge-license-dialog-start-date">
 * - End date:     <sc-datePicker id="edge-license-dialog-end-date">
 */
export class EdgeManagementPage extends BasePage {
  private readonly root = "#edge-management-page";
  private readonly addServerButton = "#edge-management-add-server";
  private readonly searchInput = "#edge-management-search";
  private readonly table = "#edge-management-table";
  private readonly pagination = "#edge-management-pagination";
  private readonly rowMenu = "sc-submenu, [class*='submenu']";

  // License dialog selectors
  private readonly licenseDialog = "#edge-license-dialog";
  private readonly licenseDialogClose = "#edge-license-dialog-close";
  private readonly licenseKey = "#edge-license-dialog-license-key";
  private readonly downloadButton = "#edge-license-dialog-download";
  private readonly revokeButton = "#edge-license-dialog-revoke";
  private readonly generateButton = "#edge-license-dialog-generate";
  private readonly generatingSpinner = "#edge-license-dialog-generating";
  private readonly emptyState = "#edge-license-dialog-empty";
  private readonly manageLicenseMenuItem = "#edge-device-menu-manage-license";
  private readonly deleteMenuItem = "#edge-device-menu-delete";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/edge-management");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async isSearchVisible(): Promise<boolean> {
    return this.page.locator(this.searchInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async searchDevices(query: string): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input, #edge-management-search-input`).first();
    await input.fill(query);
    await this.page.waitForTimeout(500);
  }

  // ── Add Server ──────────────────────────────────────────────────────────

  async isAddServerButtonVisible(): Promise<boolean> {
    return this.page.locator(this.addServerButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickAddServer(): Promise<void> {
    await this.page.locator(this.addServerButton).first().click();
  }

  // ── Table ───────────────────────────────────────────────────────────────

  async isTableVisible(): Promise<boolean> {
    return this.page.locator(this.table).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getTableRowCount(): Promise<number> {
    // Count only tbody rows to exclude the header row
    const tbodyRows = this.page.locator(`${this.table} tbody tr`);
    const count = await tbodyRows.count();
    if (count > 0) return count;
    return this.page.locator(`${this.table} [class*="data-row"], ${this.table} tbody [class*="row"]`).count();
  }

  // ── Row Actions ─────────────────────────────────────────────────────────

  async openRowMenu(index: number): Promise<void> {
    const menus = this.page.locator(`${this.table} ${this.rowMenu}`);
    await menus.nth(index).click();
    await this.page.locator('[role="menu"], .mat-mdc-menu-panel').first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async clickManageLicense(): Promise<void> {
    const item = this.page.locator(`${this.manageLicenseMenuItem}, [role="menuitem"]:has-text("Manage License")`).first();
    await item.click();
  }

  async clickDeleteDevice(): Promise<void> {
    const item = this.page.locator(`${this.deleteMenuItem}, [role="menuitem"]:has-text("Delete")`).first();
    await item.click();
  }

  // ── License Dialog ──────────────────────────────────────────────────────

  async isLicenseDialogVisible(): Promise<boolean> {
    return this.page.locator(this.licenseDialog).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async closeLicenseDialog(): Promise<void> {
    await this.page.locator(this.licenseDialogClose).first().click();
  }

  async isLicenseKeyVisible(): Promise<boolean> {
    return this.page.locator(this.licenseKey).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isDownloadButtonVisible(): Promise<boolean> {
    return this.page.locator(this.downloadButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isRevokeButtonVisible(): Promise<boolean> {
    return this.page.locator(this.revokeButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isGenerateButtonVisible(): Promise<boolean> {
    return this.page.locator(this.generateButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isEmptyStateInDialogVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ── Pagination ──────────────────────────────────────────────────────────

  async isPaginationVisible(): Promise<boolean> {
    return this.page.locator(this.pagination).first().isVisible({ timeout: 5000 }).catch(() => false);
  }
}
