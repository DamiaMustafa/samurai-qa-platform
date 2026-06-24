import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * UserManagementPage — user listing, search, role filters, pending requests, dialogs.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 * - Root:           <div id="user-management-page" class="user-management">
 * - Users tab:      <a id="user-management-users-tab">
 * - Companies tab:  <a id="user-management-companies-tab"> (superadmin only)
 *
 * Users sub-page:
 * - Root:           <div id="users-list-page" class="users">
 * - Search:         <sc-search id="users-quick-search">
 * - Members tab:    <button id="users-tab-members">
 * - Pending tab:    <button id="users-tab-pending-requests">
 * - Add user:       <button id="users-add-new-user-button"> (via layout service)
 * - Members table:  tw-table with rows
 * - Pagination:     <sc-pagination id="users-members-pagination">
 *
 * Dialogs:
 * - Add user:       <div id="users-add-new-user-dialog">
 * - Add confirm:    <button id="users-add-new-user-confirm-button">
 * - Add cancel:     <button id="users-add-new-user-cancel-button">
 * - Edit user:      <div id="users-edit-user-dialog">
 * - Delete user:    <div id="users-delete-user-dialog">
 */
export class UserManagementPage extends BasePage {
  private readonly root = "#user-management-page, .user-management";
  private readonly usersTab = "#user-management-users-tab";
  private readonly companiesTab = "#user-management-companies-tab";

  // Users page
  private readonly usersRoot = "#users-list-page, .users";
  private readonly searchInput = "#users-quick-search";
  private readonly membersTab = "#users-tab-members";
  private readonly pendingTab = "#users-tab-pending-requests";
  private readonly addNewUserButton = "#users-add-new-user-button";
  private readonly membersPagination = "#users-members-pagination";
  private readonly pendingPagination = "#users-pending-pagination";

  // Dialogs
  private readonly addUserDialog = "#users-add-new-user-dialog";
  private readonly addUserConfirm = "#users-add-new-user-confirm-button";
  private readonly addUserCancel = "#users-add-new-user-cancel-button";
  private readonly editUserDialog = "#users-edit-user-dialog";
  private readonly deleteUserDialog = "#users-delete-user-dialog";
  private readonly deleteUserConfirm = "#users-delete-user-confirm-button";
  private readonly deleteUserCancel = "#users-delete-user-cancel-button";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/user-management/users");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(".user-management, #user-management-page").first()
      .isVisible({ timeout: 10000 }).catch(() => false);
  }

  // ── Tabs ────────────────────────────────────────────────────────────────

  async isUsersTabVisible(): Promise<boolean> {
    return this.page.locator(this.usersTab).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isCompaniesTabVisible(): Promise<boolean> {
    return this.page.locator(this.companiesTab).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickUsersTab(): Promise<void> {
    await this.page.locator(this.usersTab).first().click();
    await this.waitForReady();
  }

  async clickCompaniesTab(): Promise<void> {
    await this.page.locator(this.companiesTab).first().click();
    await this.waitForReady();
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async isSearchVisible(): Promise<boolean> {
    return this.page.locator(this.searchInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async searchUsers(query: string): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input`).first();
    await input.fill(query);
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(`${this.searchInput} input`).first();
    await input.clear();
    await this.page.waitForTimeout(500);
  }

  // ── Members / Pending Tabs ──────────────────────────────────────────────

  async clickMembersTab(): Promise<void> {
    await this.page.locator(this.membersTab).first().click();
    await this.page.waitForTimeout(500);
  }

  async clickPendingTab(): Promise<void> {
    await this.page.locator(this.pendingTab).first().click();
    await this.page.waitForTimeout(500);
  }

  async isMembersTabActive(): Promise<boolean> {
    const tab = this.page.locator(this.membersTab).first();
    const classes = await tab.getAttribute("class") || "";
    return classes.includes("active");
  }

  async isPendingTabActive(): Promise<boolean> {
    const tab = this.page.locator(this.pendingTab).first();
    const classes = await tab.getAttribute("class") || "";
    return classes.includes("active");
  }

  // ── Role Filters ────────────────────────────────────────────────────────

  async isRoleFilterVisible(): Promise<boolean> {
    return this.page.locator('[id*="users-members-filter"]').first()
      .isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickRoleFilter(filterValue: string): Promise<void> {
    const filter = this.page.locator(`[id*="users-members-filter-${filterValue}"], button:has-text("${filterValue}")`).first();
    await filter.click();
    await this.page.waitForTimeout(500);
  }

  // ── Members Table ───────────────────────────────────────────────────────

  async getMembersRowCount(): Promise<number> {
    // Count only tbody rows to exclude the header, or use specific data wrapper classes
    const tbodyRows = this.page.locator('table tbody tr');
    const count = await tbodyRows.count();
    if (count > 0) return count;
    // Fallback: count individual data row elements
    return this.page.locator('.users__listing-data [class*="row"], .users__listing-data-wrapper [class*="member"]').count();
  }

  // ── Add User ────────────────────────────────────────────────────────────

  async isAddUserButtonVisible(): Promise<boolean> {
    return this.page.locator(this.addNewUserButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ── Pagination ──────────────────────────────────────────────────────────

  async isPaginationVisible(): Promise<boolean> {
    return this.page.locator(this.membersPagination).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ── Dialogs ─────────────────────────────────────────────────────────────

  async isAddUserDialogVisible(): Promise<boolean> {
    return this.page.locator(this.addUserDialog).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isEditUserDialogVisible(): Promise<boolean> {
    return this.page.locator(this.editUserDialog).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isDeleteUserDialogVisible(): Promise<boolean> {
    return this.page.locator(this.deleteUserDialog).first().isVisible({ timeout: 5000 }).catch(() => false);
  }
}
