import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * PlanPage — company plan details, usage tracking, upgrade/renew.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 * - Root:           <div id="company-plan-page" class="plan">
 * - Back button:    <button id="company-plan-back">
 * - Upgrade btn:    <button id="company-plan-upgrade"> (Starter + Active + superadmin)
 * - Renew btn:      <button id="company-plan-renew"> (Expired + superadmin)
 * - Buy credit btn: <button id="company-plan-buy-additional-credit">
 * - Contact us:     <button id="company-plan-contact-us">
 * - Explore plans:  <button id="company-plan-explore-plans">
 *
 * Active plan sections:
 * - Status tag:     tw-tag (green = Active, red = Expired)
 * - Progress bars:  sc-progress-bar for storage and inference
 * - Credit info:    .plan__credit-info, .plan__credit-usage
 *
 * Empty state (no plan):
 * - Disclaimer:     .plan__empty-disclaimer
 * - Pricing cards:  .plan__listing-price
 */
export class PlanPage extends BasePage {
  private readonly root = "#company-plan-page, .plan";
  private readonly backButton = "#company-plan-back";
  private readonly upgradeButton = "#company-plan-upgrade";
  private readonly renewButton = "#company-plan-renew";
  private readonly buyCreditButton = "#company-plan-buy-additional-credit";
  private readonly contactUsButton = "#company-plan-contact-us";
  private readonly explorePlansButton = "#company-plan-explore-plans";

  // Active plan sections
  private readonly statusTag = "tw-tag, [class*='tag']";
  private readonly progressBars = "sc-progress-bar, [class*='progress']";
  private readonly useSections = ".plan__use-section, [class*='use-section']";
  private readonly trackerSections = ".plan__tracker-section, [class*='tracker-section']";
  private readonly creditInfo = ".plan__credit-info, [class*='credit-info']";

  // Empty state
  private readonly emptyState = ".plan__empty, [class*='plan__empty']";
  private readonly emptyDisclaimer = ".plan__empty-disclaimer, [class*='empty-disclaimer']";
  private readonly pricingCards = ".plan__listing-price, [class*='listing-price']";
  private readonly selectPlanButtons = '[id*="company-plan-select-subscription"], button:has-text("Select Plan")';

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(companyId: string): Promise<void> {
    await this.navigate(`/company/${companyId}/plan`);
    await this.waitForReady();
  }

  async gotoPlanTracking(): Promise<void> {
    await this.navigate("/plan-tracking");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(".plan, #company-plan-page").first()
      .isVisible({ timeout: 10000 }).catch(() => false);
  }

  // ── Back Navigation ─────────────────────────────────────────────────────

  async isBackButtonVisible(): Promise<boolean> {
    return this.page.locator(this.backButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickBack(): Promise<void> {
    await this.page.locator(this.backButton).first().click();
  }

  // ── Active Plan ─────────────────────────────────────────────────────────

  async isStatusTagVisible(): Promise<boolean> {
    return this.page.locator(this.statusTag).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getStatusText(): Promise<string> {
    return ((await this.page.locator(this.statusTag).first().textContent()) || "").trim();
  }

  async isProgressBarVisible(): Promise<boolean> {
    return this.page.locator(this.progressBars).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getProgressBarCount(): Promise<number> {
    return this.page.locator(this.progressBars).count();
  }

  async getUseSectionCount(): Promise<number> {
    return this.page.locator(this.useSections).count();
  }

  async getTrackerSectionCount(): Promise<number> {
    return this.page.locator(this.trackerSections).count();
  }

  // ── Action Buttons ──────────────────────────────────────────────────────

  async isUpgradeButtonVisible(): Promise<boolean> {
    return this.page.locator(this.upgradeButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickUpgrade(): Promise<void> {
    await this.page.locator(this.upgradeButton).first().click();
  }

  async isRenewButtonVisible(): Promise<boolean> {
    return this.page.locator(this.renewButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickRenew(): Promise<void> {
    await this.page.locator(this.renewButton).first().click();
  }

  async isBuyCreditButtonVisible(): Promise<boolean> {
    return this.page.locator(this.buyCreditButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickBuyCredit(): Promise<void> {
    await this.page.locator(this.buyCreditButton).first().click();
  }

  // ── Empty State (No Plan) ───────────────────────────────────────────────

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isContactUsButtonVisible(): Promise<boolean> {
    return this.page.locator(this.contactUsButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickContactUs(): Promise<void> {
    await this.page.locator(this.contactUsButton).first().click();
  }

  async isExplorePlansButtonVisible(): Promise<boolean> {
    return this.page.locator(this.explorePlansButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async clickExplorePlans(): Promise<void> {
    await this.page.locator(this.explorePlansButton).first().click();
  }

  async getPricingCardCount(): Promise<number> {
    return this.page.locator(this.pricingCards).count();
  }
}
