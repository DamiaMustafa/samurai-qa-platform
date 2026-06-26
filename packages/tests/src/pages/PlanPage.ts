import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * PlanPage — Plan Tracking list, Plan Details, usage tracking,
 * upgrade/renew dialogs, and pricing card interactions.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 *
 * Plan Tracking (/plan-tracking):
 * - Root:       <div id="plan-tracking-page" class="plan-tracking">
 * - Title:      <span id="plan-tracking-title">
 * - Search:     <sc-search id="plan-tracking-search">
 * - Table:      <sc-table id="plan-tracking-table">
 * - Pagination: <sc-pagination id="plan-tracking-pagination">
 *
 * Plan Details (/company/:id/plan):
 * - Root:       <div id="company-plan-page" class="plan">
 * - Back:       <button id="company-plan-back">
 * - Upgrade:    <button id="company-plan-upgrade"> (Starter + Active + superadmin)
 * - Renew:      <button id="company-plan-renew"> (Expired + superadmin)
 * - Buy credit: <button id="company-plan-buy-additional-credit">
 * - Status tag: <tw-tag color="green|red">
 * - Progress:   <sc-progress-bar>
 *
 * Free/superadmin pricing cards:
 * - Select plan: <button id="company-plan-select-subscription-{starter|professional}">
 *
 * Free/non-admin empty state:
 * - Contact us:    <button id="company-plan-contact-us">
 * - Explore plans: <button id="company-plan-explore-plans">
 * - Email select:  <button id="company-plan-email-selected-plan-{starter|professional}">
 *
 * Form dialog (renew/select plan):
 * - Container: .dialog or mat-dialog-container
 * - Date pickers: sc-datePicker
 * - Confirm button: tw-button="relaxed green"
 *
 * Upgrade dialog (PlanUpgradeDialogComponent):
 * - Root:      <div class="plan-upgrade">
 * - Header:    .plan-upgrade__header-title
 * - Features:  .plan-upgrade__plan-list-item
 * - Credit:    .plan-upgrade__credit-item
 * - Add btn:   .plan-upgrade__credit-btns button[tw-button="relaxed green"]
 * - Skip btn:  .plan-upgrade__credit-btns button[tw-button="relaxed hollow-green"]
 */
export class PlanPage extends BasePage {
  // ── Plan Tracking Selectors ──────────────────────────────────────────────
  private readonly trackingRoot = "#plan-tracking-page, .plan-tracking";
  private readonly trackingTitle = "#plan-tracking-title";
  private readonly trackingSearch = "#plan-tracking-search";
  private readonly trackingSearchInput = "#plan-tracking-search input, sc-search#plan-tracking-search input";
  private readonly trackingTable = "#plan-tracking-table";
  private readonly trackingTableRows = "#plan-tracking-table tr, sc-table#plan-tracking-table tr, #plan-tracking-table .sc-table-row";
  private readonly trackingPagination = "#plan-tracking-pagination";
  private readonly paginationPrev = "#plan-tracking-pagination-prev";
  private readonly paginationNext = "#plan-tracking-pagination-next";

  // ── Plan Details Selectors ───────────────────────────────────────────────
  private readonly root = "#company-plan-page, .plan";
  private readonly backButton = "#company-plan-back";

  // ── Active Plan Selectors ────────────────────────────────────────────────
  private readonly statusTag = "tw-tag";
  private readonly greenStatusTag = "tw-tag[color='green']";
  private readonly redStatusTag = "tw-tag[color='red']";
  private readonly progressBars = "sc-progress-bar";
  private readonly useSections = ".plan__use-section";
  private readonly useSectionValues = ".plan__use-section-value";
  private readonly usedValues = ".plan__use-section-value-used";
  private readonly remainingValues = ".plan__use-section-value-remaining";
  private readonly trackerSections = ".plan__tracker-section";
  private readonly creditInfo = ".plan__credit-info";
  private readonly creditUsage = ".plan__credit-usage";
  private readonly additionalSections = ".plan__section-additional";
  private readonly noCreditDisclaimer = ".plan__tracker-section-label-text";

  // ── Action Button Selectors ──────────────────────────────────────────────
  private readonly upgradeButton = "#company-plan-upgrade";
  private readonly renewButton = "#company-plan-renew";
  private readonly buyCreditButton = "#company-plan-buy-additional-credit";

  // ── Pricing Card Selectors ───────────────────────────────────────────────
  private readonly pricingCards = ".plan__listing-price";
  private readonly pricingTitle = ".plan__price-title";
  private readonly pricingPrice = ".plan__price-subscribe-details-price";
  private readonly pricingCurrency = ".plan__price-subscribe-details-currency";
  private readonly selectPlanButtons = '[id*="company-plan-select-subscription-"]';
  private readonly selectStarterButton = "#company-plan-select-subscription-starter";
  private readonly selectProfessionalButton = "#company-plan-select-subscription-professional";

  // ── Empty State Selectors ────────────────────────────────────────────────
  private readonly emptyState = ".plan__empty";
  private readonly emptyDisclaimer = ".plan__empty-disclaimer";
  private readonly emptyLogo = ".plan__empty-logo";
  private readonly contactUsButton = "#company-plan-contact-us";
  private readonly explorePlansButton = "#company-plan-explore-plans";

  // ── Non-Admin Plan Select Selectors ──────────────────────────────────────
  private readonly emailPlanButtons = '[id*="company-plan-email-selected-plan-"]';
  private readonly emailStarterButton = "#company-plan-email-selected-plan-starter";
  private readonly emailProfessionalButton = "#company-plan-email-selected-plan-professional";

  // ── Form Dialog Selectors (renew/select plan) ────────────────────────────
  private readonly formDialog = ".dialog, mat-dialog-container, [class*='form-dialog']";
  private readonly dialogConfirmButton = ".dialog button[tw-button*='green'], mat-dialog-actions button[tw-button*='green']";
  private readonly dialogCancelButton = ".dialog button[tw-button*='hollow'], mat-dialog-actions button[tw-button*='hollow']";
  private readonly dialogDatePickers = "sc-datePicker, [class*='date-picker']";

  // ── Upgrade Dialog Selectors ─────────────────────────────────────────────
  private readonly upgradeDialog = ".plan-upgrade";
  private readonly upgradeDialogTitle = ".plan-upgrade__header-title";
  private readonly upgradeFeatureList = ".plan-upgrade__plan-list-item";
  private readonly upgradeFeatureText = ".plan-upgrade__plan-list-item-text";
  private readonly upgradeSubmitButton = ".plan-upgrade__plan-btn";
  private readonly upgradeDateRow = ".plan-upgrade__date-row";

  // ── Add Credit Dialog Selectors ──────────────────────────────────────────
  private readonly creditItems = ".plan-upgrade__credit-item";
  private readonly creditItemTitle = ".plan-upgrade__credit-item-title";
  private readonly creditItemQuantityInput = ".plan-upgrade__credit-item-quantity-num input, .plan-upgrade__credit-item-quantity-num sc-input input";
  private readonly creditIncreaseButtons = ".plan-upgrade__credit-item-quantity-btn";
  private readonly creditAddButton = ".plan-upgrade__credit-btns button[tw-button='relaxed green']";
  private readonly creditSkipButton = ".plan-upgrade__credit-btns button[tw-button='relaxed hollow-green']";

  constructor(page: Page) {
    super(page);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Navigation
  // ════════════════════════════════════════════════════════════════════════════

  async goto(companyId: string): Promise<void> {
    await this.navigate(`/company/${companyId}/plan`);
    await this.waitForReady();
  }

  async gotoPlanTracking(): Promise<void> {
    await this.navigate("/plan-tracking");
    await this.waitForReady();
  }

  async isPlanTrackingLoaded(): Promise<boolean> {
    return this.page
      .locator(this.trackingRoot)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Plan Tracking — Layout
  // ════════════════════════════════════════════════════════════════════════════

  async isTrackingTitleVisible(): Promise<boolean> {
    return this.page
      .locator(this.trackingTitle)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isSearchVisible(): Promise<boolean> {
    return this.page
      .locator(this.trackingSearch)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isTableVisible(): Promise<boolean> {
    return this.page
      .locator(this.trackingTable)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isPaginationVisible(): Promise<boolean> {
    return this.page
      .locator(this.trackingPagination)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Plan Tracking — Table Data ─────────────────────────────────────────────

  async getTableRowCount(): Promise<number> {
    // Wait briefly for table rows to render
    await this.page.waitForTimeout(500);
    return this.page.locator(this.trackingTableRows).count();
  }

  async clickTableRow(index: number): Promise<void> {
    await this.page.locator(this.trackingTableRows).nth(index).click();
  }

  async getTableCellText(
    rowIndex: number,
    colIndex: number
  ): Promise<string> {
    const cell = this.page
      .locator(this.trackingTableRows)
      .nth(rowIndex)
      .locator("td")
      .nth(colIndex);
    return ((await cell.textContent()) || "").trim();
  }

  // ── Plan Tracking — Search ─────────────────────────────────────────────────

  async fillSearch(value: string): Promise<void> {
    const input = this.page.locator(this.trackingSearchInput).first();
    await input.fill(value);
    // Trigger change event for the search control
    await input.press("Enter");
    await this.page.waitForTimeout(1000);
  }

  async clearSearch(): Promise<void> {
    const input = this.page.locator(this.trackingSearchInput).first();
    await input.clear();
    await input.press("Enter");
    await this.page.waitForTimeout(1000);
  }

  // ── Plan Tracking — Pagination ─────────────────────────────────────────────

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

  // ════════════════════════════════════════════════════════════════════════════
  // Plan Details — Layout
  // ════════════════════════════════════════════════════════════════════════════

  async isBackButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.backButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickBack(): Promise<void> {
    await this.page.locator(this.backButton).first().click();
  }

  async getCompanyName(): Promise<string> {
    const title = this.page.locator(".plan__title").first();
    return ((await title.textContent()) || "").trim();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Plan Details — Active Plan
  // ════════════════════════════════════════════════════════════════════════════

  // ── Status ─────────────────────────────────────────────────────────────────

  async isStatusTagVisible(): Promise<boolean> {
    return this.page
      .locator(this.statusTag)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getStatusText(): Promise<string> {
    return (
      (await this.page.locator(this.statusTag).first().textContent()) || ""
    ).trim();
  }

  async isActiveStatusVisible(): Promise<boolean> {
    return this.page
      .locator(this.greenStatusTag)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isExpiredStatusVisible(): Promise<boolean> {
    return this.page
      .locator(this.redStatusTag)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Usage Sections ─────────────────────────────────────────────────────────

  async getUseSectionCount(): Promise<number> {
    return this.page.locator(this.useSections).count();
  }

  async getUsedValues(): Promise<string[]> {
    const els = this.page.locator(this.usedValues);
    const count = await els.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push(((await els.nth(i).textContent()) || "").trim());
    }
    return values;
  }

  async getRemainingValues(): Promise<string[]> {
    const els = this.page.locator(this.remainingValues);
    const count = await els.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push(((await els.nth(i).textContent()) || "").trim());
    }
    return values;
  }

  // ── Tracker / Progress Bars ────────────────────────────────────────────────

  async getTrackerSectionCount(): Promise<number> {
    return this.page.locator(this.trackerSections).count();
  }

  async isProgressBarVisible(): Promise<boolean> {
    return this.page
      .locator(this.progressBars)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getProgressBarCount(): Promise<number> {
    return this.page.locator(this.progressBars).count();
  }

  // ── Additional Credit Sections ─────────────────────────────────────────────

  async getAdditionalCreditSectionCount(): Promise<number> {
    return this.page.locator(this.additionalSections).count();
  }

  async isCreditInfoVisible(): Promise<boolean> {
    return this.page
      .locator(this.creditInfo)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Action Buttons ─────────────────────────────────────────────────────────

  async isUpgradeButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.upgradeButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickUpgrade(): Promise<void> {
    await this.page.locator(this.upgradeButton).first().click();
  }

  async isRenewButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.renewButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickRenew(): Promise<void> {
    await this.page.locator(this.renewButton).first().click();
  }

  async isBuyCreditButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.buyCreditButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickBuyCredit(): Promise<void> {
    await this.page.locator(this.buyCreditButton).first().click();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Pricing Cards (Free plan — superadmin)
  // ════════════════════════════════════════════════════════════════════════════

  async getPricingCardCount(): Promise<number> {
    return this.page.locator(this.pricingCards).count();
  }

  async isPricingCardsVisible(): Promise<boolean> {
    return this.page
      .locator(this.pricingCards)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isSelectPlanButtonVisible(plan: "starter" | "professional"): Promise<boolean> {
    const sel =
      plan === "starter"
        ? this.selectStarterButton
        : this.selectProfessionalButton;
    return this.page
      .locator(sel)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickSelectPlan(plan: "starter" | "professional"): Promise<void> {
    const sel =
      plan === "starter"
        ? this.selectStarterButton
        : this.selectProfessionalButton;
    await this.page.locator(sel).first().click();
  }

  async getPricingCardTitle(index: number): Promise<string> {
    return (
      (await this.page
        .locator(this.pricingTitle)
        .nth(index)
        .textContent()) || ""
    ).trim();
  }

  async getPricingCardPrice(index: number): Promise<string> {
    return (
      (await this.page
        .locator(this.pricingPrice)
        .nth(index)
        .textContent()) || ""
    ).trim();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Empty State (Free plan — non-superadmin)
  // ════════════════════════════════════════════════════════════════════════════

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page
      .locator(this.emptyState)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isEmptyDisclaimerVisible(): Promise<boolean> {
    return this.page
      .locator(this.emptyDisclaimer)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isContactUsButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.contactUsButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickContactUs(): Promise<void> {
    await this.page.locator(this.contactUsButton).first().click();
  }

  async isExplorePlansButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.explorePlansButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickExplorePlans(): Promise<void> {
    await this.page.locator(this.explorePlansButton).first().click();
  }

  async isEmailPlanButtonVisible(
    plan: "starter" | "professional"
  ): Promise<boolean> {
    const sel =
      plan === "starter"
        ? this.emailStarterButton
        : this.emailProfessionalButton;
    return this.page
      .locator(sel)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Form Dialog (renew plan / select plan date picker dialog)
  // ════════════════════════════════════════════════════════════════════════════

  async isFormDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.formDialog)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickDialogConfirm(): Promise<void> {
    await this.page.locator(this.dialogConfirmButton).first().click();
  }

  async clickDialogCancel(): Promise<void> {
    await this.page.locator(this.dialogCancelButton).first().click();
  }

  async getDialogDatePickerCount(): Promise<number> {
    return this.page.locator(this.dialogDatePickers).count();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Upgrade Dialog (PlanUpgradeDialogComponent — plan-upgrade page)
  // ════════════════════════════════════════════════════════════════════════════

  async isUpgradeDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.upgradeDialog)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async getUpgradeDialogTitle(): Promise<string> {
    return (
      (await this.page
        .locator(this.upgradeDialogTitle)
        .first()
        .textContent()) || ""
    ).trim();
  }

  async getUpgradeFeatureCount(): Promise<number> {
    return this.page.locator(this.upgradeFeatureList).count();
  }

  async getUpgradeFeatureTexts(): Promise<string[]> {
    const els = this.page.locator(this.upgradeFeatureText);
    const count = await els.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push(((await els.nth(i).textContent()) || "").trim());
    }
    return texts;
  }

  async isUpgradeSubmitButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.upgradeSubmitButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isUpgradeSubmitDisabled(): Promise<boolean> {
    const btn = this.page.locator(this.upgradeSubmitButton).first();
    const disabled = await btn.getAttribute("disabled");
    return disabled !== null;
  }

  async getUpgradeDatePickerCount(): Promise<number> {
    return this.page.locator(this.upgradeDateRow).count();
  }

  async clickUpgradeSubmit(): Promise<void> {
    await this.page.locator(this.upgradeSubmitButton).first().click();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Add Credit Dialog (PlanUpgradeDialogComponent — add-credit page)
  // ════════════════════════════════════════════════════════════════════════════

  async isAddCreditDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.creditItems)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async getCreditItemCount(): Promise<number> {
    return this.page.locator(this.creditItems).count();
  }

  async getCreditItemTitles(): Promise<string[]> {
    const els = this.page.locator(this.creditItemTitle);
    const count = await els.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      titles.push(((await els.nth(i).textContent()) || "").trim());
    }
    return titles;
  }

  async clickCreditIncrease(itemIndex: number): Promise<void> {
    // Each credit item has 2 quantity buttons: minus (0) and plus (1)
    // The plus button is at offset 1 within each item
    const item = this.page.locator(this.creditItems).nth(itemIndex);
    const buttons = item.locator(this.creditIncreaseButtons);
    // The second button is the increase (+) button
    await buttons.nth(1).click();
  }

  async clickCreditDecrease(itemIndex: number): Promise<void> {
    const item = this.page.locator(this.creditItems).nth(itemIndex);
    const buttons = item.locator(this.creditIncreaseButtons);
    // The first button is the decrease (-) button
    await buttons.nth(0).click();
  }

  async isAddCreditButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.creditAddButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickAddCredit(): Promise<void> {
    await this.page.locator(this.creditAddButton).first().click();
  }

  async isSkipButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.creditSkipButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickSkip(): Promise<void> {
    await this.page.locator(this.creditSkipButton).first().click();
  }
}
