import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * SignUpPage — sign up / registration at /sign-up.
 *
 * DOM reference:
 * - Email:       <tw-input id="signup-email" type="email">
 * - Password:    <tw-input id="signup-password" type="password">
 * - Confirm:     <tw-input id="signup-confirm-password" type="password">
 * - Submit:      <button id="signup-submit-button">
 * - Sign In link:<a id="signup-sign-in-link">
 * - Customer ID: <tw-input id="signup-customer-id"> (conditional)
 */
export class SignUpPage extends BasePage {
  private readonly root = "sign-up, .sign-up";
  private readonly emailInput = "#signup-email";
  private readonly passwordInput = "#signup-password";
  private readonly confirmPasswordInput = "#signup-confirm-password";
  private readonly submitButton = "#signup-submit-button";
  private readonly signInLink = "#signup-sign-in-link";
  private readonly customerIdInput = "#signup-customer-id";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate("/sign-up");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.emailInput).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async isEmailVisible(): Promise<boolean> {
    return this.page.locator(this.emailInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isPasswordVisible(): Promise<boolean> {
    return this.page.locator(this.passwordInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isConfirmPasswordVisible(): Promise<boolean> {
    return this.page.locator(this.confirmPasswordInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isSubmitButtonVisible(): Promise<boolean> {
    return this.page.locator(this.submitButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return this.page.locator(this.submitButton).first().isDisabled().catch(() => true);
  }

  async isSignInLinkVisible(): Promise<boolean> {
    return this.page.locator(this.signInLink).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async fillEmail(email: string): Promise<void> {
    const input = this.page.locator(`${this.emailInput} input[type="email"], input#signup-email`).first();
    await input.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    const input = this.page.locator(`${this.passwordInput} input, input#signup-password`).first();
    await input.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    const input = this.page.locator(`${this.confirmPasswordInput} input, input#signup-confirm-password`).first();
    await input.fill(password);
  }

  async clickSubmit(): Promise<void> {
    await this.page.locator(this.submitButton).first().click();
  }

  async clickSignInLink(): Promise<void> {
    await this.page.locator(this.signInLink).first().click();
  }

  async expectSignInNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/sign-in|login/, { timeout: 10000 });
  }

  async isCustomerIdVisible(): Promise<boolean> {
    return this.page.locator(this.customerIdInput).first().isVisible({ timeout: 3000 }).catch(() => false);
  }
}
