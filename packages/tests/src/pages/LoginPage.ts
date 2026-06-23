import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { envConfig } from "../config/environments";

/**
 * LoginPage — handles authentication for Samurai Central.
 * Sign-in page: /sign-in
 *
 * DOM reference (Angular + custom tw-* component library):
 * - Email:    <tw-input type="email" id="login-email" formControlName="email">
 * - Password: <tw-input type="password" id="login-password" formControlName="password">
 * - Submit:   <button type="submit" id="login-sign-in-button" tw-button>
 * - Error:    <tw-error class="welcome__login-error"> (shown on invalidCredentials)
 * - Forgot:   <a id="login-forgot-password-link" routerLink="/forgot-password">
 */
export class LoginPage extends BasePage {
  // ── Selectors (verified against staging DOM) ────────────────────────────
  private readonly emailInput = '#login-email input[type="email"], input#login-email, input[type="email"]';
  private readonly passwordInput = '#login-password input[type="password"], input#login-password, input[type="password"]';
  private readonly submitButton = '#login-sign-in-button, button[type="submit"]';
  private readonly errorMessage = '.welcome__login-error, tw-error, [role="alert"]';
  private readonly forgotPasswordLink = '#login-forgot-password-link, a[href*="forgot-password"]';
  private readonly rememberMeCheckbox = 'input[type="checkbox"]';

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/sign-in");
    await this.waitForReady();
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  async login(username: string, password: string): Promise<void> {
    await this.goto();
    await this.page.locator(this.emailInput).first().fill(username);
    await this.page.locator(this.passwordInput).first().fill(password);
    await this.page.locator(this.submitButton).first().click();
    await this.waitForReady();
  }

  async loginAs(role: "admin" | "standard"): Promise<void> {
    const creds = envConfig.credentials[role];
    if (!creds.username || !creds.password) {
      throw new Error(
        `Missing credentials for role "${role}". Set ${role.toUpperCase()}_USERNAME and ${role.toUpperCase()}_PASSWORD in .env`
      );
    }
    await this.login(creds.username, creds.password);
  }

  async loginWithInvalidCredentials(): Promise<void> {
    await this.login("invalid@test.com", "wrongpassword123");
  }

  // ── Assertions ──────────────────────────────────────────────────────────

  async expectLoginPage(): Promise<void> {
    await this.expectUrlContains("sign-in|login|signin");
  }

  async expectLoginError(): Promise<void> {
    const error = this.page.locator(this.errorMessage).first();
    // Allow extra time for the auth API to respond
    await expect(error).toBeVisible({ timeout: 10000 });
  }

  async expectSuccessfulLogin(): Promise<void> {
    // After successful login, URL should NOT contain sign-in/login
    await expect(this.page).not.toHaveURL(/sign-in|login/);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  async getErrorMessageText(): Promise<string> {
    return this.getText(this.errorMessage);
  }

  async isLoginFormVisible(): Promise<boolean> {
    return this.isVisible(this.emailInput);
  }

  async isEmailInputVisible(): Promise<boolean> {
    return this.isVisible(this.emailInput);
  }

  async isPasswordInputVisible(): Promise<boolean> {
    return this.isVisible(this.passwordInput);
  }

  async isSubmitButtonVisible(): Promise<boolean> {
    return this.isVisible(this.submitButton);
  }

  async isForgotPasswordLinkVisible(): Promise<boolean> {
    return this.isVisible(this.forgotPasswordLink);
  }

  async clickForgotPassword(): Promise<void> {
    await this.page.locator(this.forgotPasswordLink).first().click();
    await this.waitForReady();
  }

  async checkRememberMe(): Promise<void> {
    const checkbox = this.page.locator(this.rememberMeCheckbox).first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
  }
}
