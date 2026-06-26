import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * EdgeManagementPage — edge device listing, search, sort, pagination,
 * license management, version dialog, add server, delete device.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 *
 * Main page (/edge-management):
 * - Root:        <div id="edge-management-page" class="edge-management">
 * - Title:       <span id="edge-management-title">
 * - Add Server:  <button id="edge-management-add-server">
 * - Search:      <sc-search id="edge-management-search">
 *   - Input:     <input id="edge-management-search-input">
 * - Table:       <sc-table id="edge-management-table">
 * - Pagination:  <sc-pagination id="edge-management-pagination">
 *
 * Table columns: device_name, created_at, software_version, links, actions
 * - Version tag: <tw-tag color="yellow"> (clickable → opens version dialog)
 * - Link tags:   Web Portal (samurai), API Doc (pink), System Monitoring (light-green)
 * - Actions:     <sc-submenu> → Manage License, Delete
 *
 * Sort: device_name (client-side), created_at (server-side)
 * Search: 250ms debounce, client-side filter on device_name
 * Pagination: 10 items/page, cursor-based (nextToken)
 *
 * Manage License Dialog (ManageLicenseDialogComponent):
 * - Root:        <div id="edge-license-dialog">
 * - Mode 1 (existing): #edge-license-dialog-existing
 * - Mode 2 (create):   #edge-license-dialog-create
 * - Mode 3 (empty):    #edge-license-dialog-empty
 *
 * Generic Dialogs (DialogComponent):
 * - Add Server:  detail dialog with deployment guide link
 * - Delete:      confirm dialog with Cancel/Proceed buttons
 * - Version:     softwareVersion dialog with 3 service rows
 */
export class EdgeManagementPage extends BasePage {
  // ── Page Root ──────────────────────────────────────────────────────────────
  private readonly root = "#edge-management-page";
  private readonly title = "#edge-management-title";

  // ── Add Server ─────────────────────────────────────────────────────────────
  private readonly addServerButton = "#edge-management-add-server";

  // ── Search ─────────────────────────────────────────────────────────────────
  private readonly searchComponent = "#edge-management-search";
  private readonly searchInput = "#edge-management-search-input, #edge-management-search input";

  // ── Table ──────────────────────────────────────────────────────────────────
  private readonly table = "#edge-management-table";
  private readonly tableRows = "#edge-management-table tbody tr";
  private readonly tableHeaderSortIcons = "#edge-management-table .table__icon, #edge-management-table th";
  private readonly tableEmptyState = "#edge-management-table .table__empty, #edge-management-table [class*='empty']";

  // ── Version Tags (in table) ────────────────────────────────────────────────
  private readonly versionTags = "#edge-management-table tw-tag[color='yellow']";

  // ── Link Tags (in table) ───────────────────────────────────────────────────
  private readonly linkTags = "#edge-management-table sc-table__row-links tw-tag, #edge-management-table .sc-table__row-links tw-tag";
  private readonly webPortalTags = "tw-tag[color='samurai']";
  private readonly apiDocTags = "tw-tag[color='pink']";
  private readonly systemMonitoringTags = "tw-tag[color='light-green']";

  // ── Pagination ─────────────────────────────────────────────────────────────
  private readonly pagination = "#edge-management-pagination";
  private readonly paginationPrev = "#edge-management-pagination-prev";
  private readonly paginationNext = "#edge-management-pagination-next";

  // ── Row Actions Menu ───────────────────────────────────────────────────────
  private readonly rowMenu = "sc-submenu";
  private readonly menuPanel = ".submenu-panel-dark, .submenu-panel-light, [class*='submenu-panel']";
  private readonly manageLicenseMenuItem = "#edge-device-menu-manage-license, [class*='submenu__option']:has-text('Manage License')";
  private readonly deleteMenuItem = "#edge-device-menu-delete, [class*='submenu__option']:has-text('Delete')";

  // ── Manage License Dialog ──────────────────────────────────────────────────
  private readonly licenseDialog = "#edge-license-dialog";
  private readonly licenseDialogClose = "#edge-license-dialog-close";
  private readonly licenseDialogTitle = "#edge-license-dialog-title";
  private readonly licenseDialogContent = "#edge-license-dialog-content";

  // Mode 1: Existing license
  private readonly licenseDialogExisting = "#edge-license-dialog-existing";
  private readonly licenseKey = "#edge-license-dialog-license-key";
  private readonly downloadButton = "#edge-license-dialog-download";
  private readonly revokeButton = "#edge-license-dialog-revoke";
  private readonly licenseStartDate = "#edge-license-dialog-start-date-value";
  private readonly licenseEndDate = "#edge-license-dialog-end-date-value";

  // Mode 2: Create license (superadmin)
  private readonly licenseDialogCreate = "#edge-license-dialog-create";
  private readonly generateButton = "#edge-license-dialog-generate";
  private readonly generatingSpinner = "#edge-license-dialog-generating";
  private readonly generatedKeyPreview = "#edge-license-dialog-license-key-preview";
  private readonly noSourcesInput = "#edge-license-dialog-no-sources";
  private readonly startDatePicker = "#edge-license-dialog-start-date";
  private readonly endDatePicker = "#edge-license-dialog-end-date";
  private readonly startDateError = "#edge-license-dialog-start-date-error";
  private readonly endDateError = "#edge-license-dialog-end-date-error";

  // Mode 3: No license (non-superadmin)
  private readonly licenseDialogEmpty = "#edge-license-dialog-empty";
  private readonly emptyTitle = "#edge-license-dialog-empty-title";
  private readonly emptyDescription = "#edge-license-dialog-empty-description";

  // ── Generic Dialog Selectors (DialogComponent) ─────────────────────────────
  private readonly genericDialog = ".dialog";
  private readonly dialogClose = ".dialog__close, .dialog .tw-dialog__header-close-icon";
  private readonly dialogDisclaimerLink = ".dialog__content-disclaimer-link";
  private readonly dialogProceedButton = ".dialog__content-disclaimer-actions button[tw-button*='green'], .dialog__actions button[tw-button*='green']";
  private readonly dialogCancelButton = ".dialog__content-disclaimer-actions button[tw-button*='danger'], .dialog__content-disclaimer-actions button[tw-button*='secondary']";

  // ── Software Version Dialog ────────────────────────────────────────────────
  private readonly versionDialog = ".dialog__version";
  private readonly versionServiceRows = ".dialog__version-info-service";
  private readonly versionServiceLabels = ".dialog__version-info-service-label";
  private readonly versionServiceValues = ".dialog__version-info-service-value";

  // ── Toast ──────────────────────────────────────────────────────────────────
  private readonly toasts = ".toast, [class*='toast'], [class*='snack'], [class*='notification']";

  constructor(page: Page) {
    super(page);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Navigation
  // ════════════════════════════════════════════════════════════════════════════

  async goto(): Promise<void> {
    await this.navigate("/edge-management");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async isTitleVisible(): Promise<boolean> {
    return this.page
      .locator(this.title)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Add Server
  // ════════════════════════════════════════════════════════════════════════════

  async isAddServerButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.addServerButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickAddServer(): Promise<void> {
    await this.page.locator(this.addServerButton).first().click();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Search
  // ════════════════════════════════════════════════════════════════════════════

  async isSearchVisible(): Promise<boolean> {
    return this.page
      .locator(this.searchComponent)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async fillSearch(query: string): Promise<void> {
    const input = this.page.locator(this.searchInput).first();
    await input.fill(query);
    // Wait for debounce (250ms) + Angular change detection
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(this.searchInput).first();
    await input.clear();
    await this.page.waitForTimeout(500);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Table
  // ════════════════════════════════════════════════════════════════════════════

  async isTableVisible(): Promise<boolean> {
    return this.page
      .locator(this.table)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getTableRowCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    const tbodyRows = this.page.locator(this.tableRows);
    const count = await tbodyRows.count();
    if (count > 0) return count;
    return this.page
      .locator(
        `${this.table} [class*="data-row"], ${this.table} tbody [class*="row"]`
      )
      .count();
  }

  async getTableCellText(
    rowIndex: number,
    colIndex: number
  ): Promise<string> {
    const cell = this.page
      .locator(this.tableRows)
      .nth(rowIndex)
      .locator("td")
      .nth(colIndex);
    return ((await cell.textContent()) || "").trim();
  }

  async isTableEmptyStateVisible(): Promise<boolean> {
    return this.page
      .locator(this.tableEmptyState)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Sort ─────────────────────────────────────────────────────────────────────

  async clickSortHeader(columnName: string): Promise<void> {
    // Click the <th> that contains the column text
    const header = this.page
      .locator(`${this.table} th`)
      .filter({ hasText: columnName })
      .first();
    await header.click();
    await this.page.waitForTimeout(500);
  }

  async getSortDirection(): Promise<string> {
    // Look for the active sort indicator in the header
    const activeHeader = this.page
      .locator(`${this.table} th[class*='active'], ${this.table} th .table__icon[class*='active']`)
      .first();
    const cls = await activeHeader.getAttribute("class").catch(() => "");
    if (cls?.includes("desc")) return "desc";
    if (cls?.includes("asc")) return "asc";
    return "none";
  }

  // ── Version Tags ─────────────────────────────────────────────────────────────

  async isVersionTagVisible(): Promise<boolean> {
    return this.page
      .locator(this.versionTags)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickVersionTag(rowIndex: number): Promise<void> {
    const row = this.page.locator(this.tableRows).nth(rowIndex);
    const tag = row.locator("tw-tag[color='yellow']").first();
    await tag.click();
    await this.page.waitForTimeout(1000);
  }

  // ── Link Tags ────────────────────────────────────────────────────────────────

  async getLinkTagCount(rowIndex: number): Promise<number> {
    const row = this.page.locator(this.tableRows).nth(rowIndex);
    return row.locator("tw-tag").count();
  }

  async isLinkTagVisible(text: string): Promise<boolean> {
    return this.page
      .locator(`${this.table} tw-tag`)
      .filter({ hasText: text })
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getLinkTagTarget(text: string): Promise<string | null> {
    const tag = this.page
      .locator(`${this.table} tw-tag`)
      .filter({ hasText: text })
      .first();
    // tw-tag renders as an <a> or contains an <a>
    const anchor = tag.locator("a").first();
    const target = await anchor.getAttribute("target").catch(() => null);
    return target;
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

  // ════════════════════════════════════════════════════════════════════════════
  // Row Actions Menu
  // ════════════════════════════════════════════════════════════════════════════

  async openRowMenu(index: number): Promise<void> {
    const menus = this.page.locator(`${this.table} ${this.rowMenu}`);
    await menus.nth(index).click();
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

  async isManageLicenseOptionVisible(): Promise<boolean> {
    return this.page
      .locator(this.manageLicenseMenuItem)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickManageLicense(): Promise<void> {
    await this.page.locator(this.manageLicenseMenuItem).first().click();
  }

  async isDeleteOptionVisible(): Promise<boolean> {
    return this.page
      .locator(this.deleteMenuItem)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickDeleteDevice(): Promise<void> {
    await this.page.locator(this.deleteMenuItem).first().click();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Delete Confirmation Dialog (generic DialogComponent)
  // ════════════════════════════════════════════════════════════════════════════

  async isDeleteDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.genericDialog)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickProceed(): Promise<void> {
    await this.page.locator(this.dialogProceedButton).first().click();
  }

  async clickDialogCancel(): Promise<void> {
    await this.page.locator(this.dialogCancelButton).first().click();
  }

  async isDialogTextVisible(text: string): Promise<boolean> {
    return this.page
      .locator(this.genericDialog)
      .filter({ hasText: text })
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Add Server Dialog (generic DialogComponent — detail type)
  // ════════════════════════════════════════════════════════════════════════════

  async isAddServerDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.genericDialog)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isDeploymentGuideLinkVisible(): Promise<boolean> {
    return this.page
      .locator(this.dialogDisclaimerLink)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async closeGenericDialog(): Promise<void> {
    await this.page.locator(this.dialogClose).first().click();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Software Version Dialog (generic DialogComponent — softwareVersion type)
  // ════════════════════════════════════════════════════════════════════════════

  async isVersionDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.versionDialog)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async getVersionServiceCount(): Promise<number> {
    return this.page.locator(this.versionServiceRows).count();
  }

  async getVersionServiceLabels(): Promise<string[]> {
    const els = this.page.locator(this.versionServiceLabels);
    const count = await els.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      labels.push(((await els.nth(i).textContent()) || "").trim());
    }
    return labels;
  }

  async getVersionServiceValues(): Promise<string[]> {
    const els = this.page.locator(this.versionServiceValues);
    const count = await els.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push(((await els.nth(i).textContent()) || "").trim());
    }
    return values;
  }

  async closeVersionDialog(): Promise<void> {
    // Generic dialog close button
    const closeBtn = this.page
      .locator(
        `${this.genericDialog} button:has-text("Close"), ${this.dialogClose}`
      )
      .first();
    await closeBtn.click();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Manage License Dialog — Common
  // ════════════════════════════════════════════════════════════════════════════

  async isLicenseDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.licenseDialog)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async closeLicenseDialog(): Promise<void> {
    await this.page.locator(this.licenseDialogClose).first().click();
  }

  async getLicenseDialogTitle(): Promise<string> {
    return (
      (await this.page
        .locator(this.licenseDialogTitle)
        .first()
        .textContent()) || ""
    ).trim();
  }

  // ── Mode 1: Existing License ─────────────────────────────────────────────────

  async isExistingLicenseViewVisible(): Promise<boolean> {
    return this.page
      .locator(this.licenseDialogExisting)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isLicenseKeyVisible(): Promise<boolean> {
    return this.page
      .locator(this.licenseKey)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getLicenseKeyText(): Promise<string> {
    return (
      (await this.page
        .locator(this.licenseKey)
        .first()
        .textContent()) || ""
    ).trim();
  }

  async isDownloadButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.downloadButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickDownload(): Promise<void> {
    await this.page.locator(this.downloadButton).first().click();
  }

  async isRevokeButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.revokeButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickRevoke(): Promise<void> {
    await this.page.locator(this.revokeButton).first().click();
  }

  async getLicenseStartDate(): Promise<string> {
    return (
      (await this.page
        .locator(this.licenseStartDate)
        .first()
        .textContent()) || ""
    ).trim();
  }

  async getLicenseEndDate(): Promise<string> {
    return (
      (await this.page
        .locator(this.licenseEndDate)
        .first()
        .textContent()) || ""
    ).trim();
  }

  // ── Mode 2: Create License ───────────────────────────────────────────────────

  async isCreateLicenseViewVisible(): Promise<boolean> {
    return this.page
      .locator(this.licenseDialogCreate)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isGenerateButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.generateButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isGenerateButtonDisabled(): Promise<boolean> {
    const btn = this.page.locator(this.generateButton).first();
    const disabled = await btn.getAttribute("disabled");
    return disabled !== null;
  }

  async clickGenerate(): Promise<void> {
    await this.page.locator(this.generateButton).first().click();
  }

  async isGeneratingSpinnerVisible(): Promise<boolean> {
    return this.page
      .locator(this.generatingSpinner)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isGeneratedKeyPreviewVisible(): Promise<boolean> {
    return this.page
      .locator(this.generatedKeyPreview)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async getGeneratedKeyText(): Promise<string> {
    return (
      (await this.page
        .locator(this.generatedKeyPreview)
        .first()
        .textContent()) || ""
    ).trim();
  }

  async fillNoSources(value: string): Promise<void> {
    const input = this.page
      .locator(`${this.noSourcesInput} input, ${this.noSourcesInput}`)
      .first();
    await input.fill(value);
  }

  async isStartDateErrorVisible(): Promise<boolean> {
    return this.page
      .locator(this.startDateError)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isEndDateErrorVisible(): Promise<boolean> {
    return this.page
      .locator(this.endDateError)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Mode 3: Empty (non-superadmin) ───────────────────────────────────────────

  async isEmptyStateInDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.licenseDialogEmpty)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isEmptyStateTitleVisible(): Promise<boolean> {
    return this.page
      .locator(this.emptyTitle)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isEmptyStateDescriptionVisible(): Promise<boolean> {
    return this.page
      .locator(this.emptyDescription)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Toasts
  // ════════════════════════════════════════════════════════════════════════════

  async isToastVisible(textFragment: string): Promise<boolean> {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const toasts = this.page.locator(this.toasts);
      const count = await toasts.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const text = await toasts.nth(i).textContent().catch(() => "");
        if (text && text.includes(textFragment)) return true;
      }
      await this.page.waitForTimeout(500);
    }
    return false;
  }
}
