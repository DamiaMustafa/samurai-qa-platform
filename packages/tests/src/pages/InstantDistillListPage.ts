import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * InstantDistillListPage — Instant Distill project listing at /instant-distill.
 *
 * DOM reference (verified against Angular template):
 * - Root:               <div id="instant-distill-list-page">
 * - Search:             <sc-search id="instant-distill-quick-search">
 *   Search input:       <input id="instant-distill-quick-search-input">
 * - Create button:      <button id="instant-distill-create-project-button">
 * - Empty state:        <div id="instant-distill-empty-state">
 * - Empty create btn:   <button id="instant-distill-empty-create-project-button">
 * - Cards container:    <sc-project-cards-listing id="instant-distill-project-cards">
 * - Each card:          <sc-project-card> (renders <div class="project">)
 *   Card open button:   <button class="project__details-buttons-btn-open">
 *   Card menu trigger:  <button> inside <sc-submenu> (Angular Material mat-menu)
 *
 * Menu items (when opened via mat-menu):
 *   - Copy Id, Rename, Delete (duplicate/archive/unarchive hidden for distill)
 *   - Rendered as <button mat-menu-item> in CDK overlay .mat-menu-panel
 *
 * Dialogs:
 *   - Rename: form dialog via DialogService.showFormDialog()
 *   - Delete: confirm dialog via DialogService.showConfirmDialog()
 *   - Both render inside .dialog or .cdk-overlay-pane
 */
export class InstantDistillListPage extends BasePage {
  private readonly root = "#instant-distill-list-page";

  // Search
  private readonly searchInput = "#instant-distill-quick-search-input";

  // Create buttons
  private readonly createButton = "#instant-distill-create-project-button";
  private readonly emptyCreateButton = "#instant-distill-empty-create-project-button";

  // Empty state
  private readonly emptyState = "#instant-distill-empty-state";

  // Cards
  private readonly cardsContainer = "#instant-distill-project-cards";

  // Dialog selectors
  private readonly dialogPanel = ".dialog:visible";
  private readonly dialogConfirmButton = ".dialog .dialog__actions-positive, .dialog button[tw-button*='green']";
  private readonly dialogCancelButton = ".dialog .dialog__actions-negative, .dialog button[tw-button*='danger'], .dialog button[tw-button*='secondary']";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/instant-distill");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async isSearchVisible(): Promise<boolean> {
    return this.page
      .locator(this.searchInput)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async fillSearch(text: string): Promise<void> {
    const input = this.page.locator(this.searchInput).first();
    await input.fill(text);
    // The search triggers on changeEvent; fill() triggers input events
    // Wait for Angular change detection
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(this.searchInput).first();
    await input.clear();
    await this.page.waitForTimeout(500);
  }

  // ── Create Button ──────────────────────────────────────────────────────

  async isCreateButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.createButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickCreate(): Promise<void> {
    await this.page.locator(this.createButton).first().click();
  }

  async isEmptyCreateButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.emptyCreateButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickEmptyCreate(): Promise<void> {
    await this.page.locator(this.emptyCreateButton).first().click();
  }

  // ── Empty State ────────────────────────────────────────────────────────

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page
      .locator(this.emptyState)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Cards ──────────────────────────────────────────────────────────────

  async getCardCount(): Promise<number> {
    return this.page.locator("sc-project-card .project").count();
  }

  async getCardNames(): Promise<string[]> {
    const cards = this.page.locator("sc-project-card .project");
    const count = await cards.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await cards
        .nth(i)
        .locator(".project__name, .project__details-title")
        .first()
        .textContent()
        .catch(() => "");
      if (text) names.push(text.trim());
    }
    return names;
  }

  async clickCardOpen(index: number): Promise<void> {
    await this.page
      .locator("sc-project-card .project")
      .nth(index)
      .locator(".project__details-buttons-btn-open")
      .first()
      .click();
  }

  // ── Card Menu ──────────────────────────────────────────────────────────

  /**
   * Open the kebab menu on a project card.
   * The sc-submenu component uses Angular Material mat-menu.
   * The trigger button has a dynamic ID based on the project ID.
   */
  async openCardMenu(index: number): Promise<void> {
    // Click the submenu trigger button inside the card
    const trigger = this.page
      .locator("sc-project-card .project")
      .nth(index)
      .locator("sc-submenu button, .project__details-buttons-btn-more button")
      .first();
    await trigger.click();

    // Wait for the Material menu panel to appear in the CDK overlay
    await this.page
      .locator(".mat-menu-panel")
      .first()
      .waitFor({ state: "visible", timeout: 5_000 });
    await this.page.waitForTimeout(300);
  }

  /**
   * Click a menu item by its visible text.
   * Options: "Copy Id", "Rename", "Delete"
   */
  async clickMenuAction(action: string): Promise<void> {
    await this.page
      .locator(".mat-menu-panel button.mat-menu-item")
      .filter({ hasText: new RegExp(action, "i") })
      .first()
      .click();
    await this.page.waitForTimeout(300);
  }

  // ── Dialog Interactions ────────────────────────────────────────────────

  /**
   * Check if any dialog is currently visible.
   */
  async isDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.dialogPanel)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  /**
   * Get the value of the first text input inside the visible dialog.
   * Used for the rename form dialog.
   */
  async getDialogInputValue(): Promise<string> {
    return (
      (await this.page
        .locator(".dialog:visible input[type='text'], .dialog:visible input:not([type])")
        .first()
        .inputValue()
        .catch(() => "")) || ""
    );
  }

  /**
   * Fill the first text input inside the visible dialog.
   */
  async fillDialogInput(value: string): Promise<void> {
    const input = this.page
      .locator(".dialog:visible input[type='text'], .dialog:visible input:not([type])")
      .first();
    await input.clear();
    await input.fill(value);
  }

  /**
   * Click the positive/confirm button in the visible dialog.
   */
  async clickDialogConfirm(): Promise<void> {
    // Try the positive actions button first, fall back to green button
    const btn = this.page
      .locator(this.dialogConfirmButton)
      .first();
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click the negative/cancel button in the visible dialog.
   */
  async clickDialogCancel(): Promise<void> {
    const btn = this.page
      .locator(this.dialogCancelButton)
      .first();
    await btn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Poll for a dialog containing the expected text fragment.
   */
  async waitForDialogWithText(
    textFragment: string,
    timeout = 10_000
  ): Promise<boolean> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const dialogs = this.page.locator(".dialog:visible");
      const count = await dialogs.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const text = await dialogs.nth(i).textContent().catch(() => "");
        if (text && text.includes(textFragment)) return true;
      }
      await this.page.waitForTimeout(500);
    }
    return false;
  }

  // ── Toast ──────────────────────────────────────────────────────────────

  /**
   * Wait for a toast notification containing the expected text.
   */
  async waitForToast(
    textFragment: string,
    timeout = 10_000
  ): Promise<boolean> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const toasts = this.page.locator(".toast, [class*='toast'], [class*='snack']");
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
