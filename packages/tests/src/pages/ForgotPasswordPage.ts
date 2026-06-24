import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ForgotPasswordPage — password recovery at /forgot-password.
 *
 * Two-step flow:
 * Step 1 (email):
 * - Email:    <sc-input id="forgot-password-email-input">
 * - Request:  <button id="forgot-password-request-button">
 * - Cancel:   <button id="forgot-password-cancel-request-button">
 *
 * Step 2 (reset):
 * - Code:     <sc-input id="forgot-password-code-input">
 * - Password: <sc-input id="forgot-password-new-password-input">
 * - Confirm:  <sc-input id="forgot-password-confirm-password-input">
 * - Renew:    <button id="forgot-password-renew-button">
 * - Cancel:   <button id="forgot-password-cancel-reset-button">
 */
export class ForgotPasswordPage extends BasePage {
  // Step 1 - Email
  private readonly emailInput = "#forgot-password-email-input";
  private readonly requestButton = "#forgot-password-request-button";
  private readonly cancelRequestButton = "#forgot-password-cancel-request-button";

  // Step 2 - Reset
  private readonly codeInput = "#forgot-password-code-input";
  private readonly newPasswordInput = "#forgot-password-new-password-input";
  private readonly confirmPasswordInput = "#forgot-password-confirm-password-input";
  private readonly renewButton = "#forgot-password-renew-button";
  private readonly cancelResetButton = "#forgot-password-cancel-reset-button";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate("/forgot-password");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.emailInput).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  // ── Step 1: Email ─────────────────────────────────────────────────────

  async isEmailInputVisible(): Promise<boolean> {
    return this.page.locator(this.emailInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isRequestButtonVisible(): Promise<boolean> {
    return this.page.locator(this.requestButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isRequestButtonDisabled(): Promise<boolean> {
    return this.page.locator(this.requestButton).first().isDisabled().catch(() => true);
  }

  async isCancelRequestButtonVisible(): Promise<boolean> {
    return this.page.locator(this.cancelRequestButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async fillEmail(email: string): Promise<void> {
    const input = this.page.locator(`${this.emailInput} input`).first();
    await input.fill(email);
  }

  async clickRequest(): Promise<void> {
    await this.page.locator(this.requestButton).first().click();
  }

  async clickCancelRequest(): Promise<void> {
    await this.page.locator(this.cancelRequestButton).first().click();
  }

  // ── Step 2: Reset ─────────────────────────────────────────────────────

  async isCodeInputVisible(): Promise<boolean> {
    return this.page.locator(this.codeInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isNewPasswordVisible(): Promise<boolean> {
    return this.page.locator(this.newPasswordInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isConfirmPasswordVisible(): Promise<boolean> {
    return this.page.locator(this.confirmPasswordInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isRenewButtonVisible(): Promise<boolean> {
    return this.page.locator(this.renewButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isCancelResetButtonVisible(): Promise<boolean> {
    return this.page.locator(this.cancelResetButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async fillCode(code: string): Promise<void> {
    const input = this.page.locator(`${this.codeInput} input`).first();
    await input.fill(code);
  }

  async fillNewPassword(password: string): Promise<void> {
    const input = this.page.locator(`${this.newPasswordInput} input`).first();
    await input.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    const input = this.page.locator(`${this.confirmPasswordInput} input`).first();
    await input.fill(password);
  }

  async clickRenew(): Promise<void> {
    await this.page.locator(this.renewButton).first().click();
  }

  async clickCancelReset(): Promise<void> {
    await this.page.locator(this.cancelResetButton).first().click();
  }

  async expectSignInNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/sign-in|login/, { timeout: 10000 });
  }
}
