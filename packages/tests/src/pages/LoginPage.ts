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
  private readonly passwordInput = '#login-password input, input#login-password, input[type="password"]';
  private readonly submitButton = '#login-sign-in-button, button[type="submit"]';
  private readonly errorMessage = '.welcome__login-error, tw-error, [role="alert"]';
  private readonly forgotPasswordLink = '#login-forgot-password-link, a[href*="forgot-password"]';
  private readonly rememberMeCheckbox = 'input[type="checkbox"]';
  private readonly signUpLink = 'a[href*="sign-up"], a[routerLink*="sign-up"]';
  private readonly googleSignInButton = 'button:has-text("Sign in with Google")';
  private readonly languageSelector = '[role="combobox"], .language-selector, .lang-selector, [class*="language"], [class*="lang-select"]';
  private readonly passwordToggle = 'button:has-text("Hide"), button:has-text("Show"), img[alt*="Hide"], img[alt*="Show"], img[alt*="hide"], img[alt*="show"]';

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
    // Wait for any loading overlay (e.g. "Hold on...") to clear
    await this.page
      .locator("body")
      .waitFor({ state: "visible", timeout: 15000 });
    await this.page.waitForFunction(
      () => !document.body.innerText.includes("Hold on"),
      { timeout: 15000 }
    );
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
    // Check for login errors before asserting URL change
    const errorText = await this.getLoginErrorMessage();
    if (errorText) {
      throw new Error(`Login failed — ${errorText.trim()}`);
    }
    // After successful login, URL should NOT contain sign-in/login
    await expect(this.page).not.toHaveURL(/sign-in|login/, { timeout: 15000 });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  async getErrorMessageText(): Promise<string> {
    return this.getText(this.errorMessage);
  }

  async getLoginErrorMessage(): Promise<string | null> {
    // Check standard error message selectors
    const errorLocator = this.page.locator(this.errorMessage).first();
    if (await errorLocator.isVisible().catch(() => false)) {
      const text = (await errorLocator.textContent())?.trim();
      if (text) return text;
    }
    // Fallback: scan page body for common login failure messages
    const bodyText = await this.page.locator("body").innerText().catch(() => "");
    const match = bodyText.match(
      /password.*expired|must be reset[^.]*|account.*locked|account.*disabled|invalid.*credentials/i
    );
    if (match) return match[0];
    return null;
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
    // Wait for Angular router navigation
    await this.page.waitForURL((url) => !url.toString().includes("sign-in"), {
      timeout: 10000,
    }).catch(() => {});
    await this.waitForReady();
  }

  async checkRememberMe(): Promise<void> {
    const checkbox = this.page.locator(this.rememberMeCheckbox).first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
  }

  // ── Validation ──────────────────────────────────────────────────────────

  async isSubmitButtonEnabled(): Promise<boolean> {
    return this.page.locator(this.submitButton).first().isEnabled();
  }

  async clickSubmit(): Promise<void> {
    await this.page.locator(this.submitButton).first().click();
  }

  async fillEmailOnly(email: string): Promise<void> {
    await this.page.locator(this.emailInput).first().fill(email);
    // Blur to trigger validation
    await this.page.locator(this.passwordInput).first().click();
  }

  async fillPasswordOnly(password: string): Promise<void> {
    await this.page.locator(this.passwordInput).first().fill(password);
    // Blur to trigger validation
    await this.page.locator(this.emailInput).first().click();
  }

  async getEmailValidationError(): Promise<string | null> {
    // tw-input renders validation errors in sibling/descendant <p> elements
    const container = this.page.locator("#login-email").first();
    const errors = container.locator("p, .error, .validation-error");
    const count = await errors.count();
    for (let i = 0; i < count; i++) {
      const text = (await errors.nth(i).textContent())?.trim();
      if (text && text.length > 0) return text;
    }
    return null;
  }

  async getPasswordValidationError(): Promise<string | null> {
    const container = this.page.locator("#login-password").first();
    const errors = container.locator("p, .error, .validation-error");
    const count = await errors.count();
    for (let i = 0; i < count; i++) {
      const text = (await errors.nth(i).textContent())?.trim();
      if (text && text.length > 0) return text;
    }
    return null;
  }

  // ── Navigation helpers ─────────────────────────────────────────────────

  async isSignUpLinkVisible(): Promise<boolean> {
    return this.isVisible(this.signUpLink);
  }

  async clickSignUp(): Promise<void> {
    await this.page.locator(this.signUpLink).first().click();
    // Wait for Angular router navigation
    await this.page.waitForURL((url) => !url.toString().includes("sign-in"), {
      timeout: 10000,
    }).catch(() => {});
    await this.waitForReady();
  }

  async isGoogleSignInVisible(): Promise<boolean> {
    return this.isVisible(this.googleSignInButton);
  }

  async isLanguageSelectorVisible(): Promise<boolean> {
    // Try combobox role first (accessibility tree), then CSS selectors
    const byRole = this.page.getByRole("combobox");
    if (await byRole.first().isVisible().catch(() => false)) return true;
    return this.isVisible(this.languageSelector);
  }

  async getCurrentLanguage(): Promise<string> {
    const byRole = this.page.getByRole("combobox").first();
    if (await byRole.isVisible().catch(() => false)) {
      return (await byRole.textContent())?.trim() || "";
    }
    const selector = this.page.locator(this.languageSelector).first();
    return (await selector.textContent())?.trim() || "";
  }

  async isPasswordToggleVisible(): Promise<boolean> {
    const toggle = this.page.locator(this.passwordToggle).first();
    try {
      await toggle.waitFor({ state: "attached", timeout: 3000 });
      return await toggle.isVisible();
    } catch {
      return false;
    }
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.page.locator(this.passwordToggle).first().click();
  }

  // ── Security / UX ──────────────────────────────────────────────────────

  async getPasswordInputType(): Promise<string> {
    return (
      (await this.page
        .locator(this.passwordInput)
        .first()
        .getAttribute("type")) || ""
    );
  }

  async fillEmail(email: string): Promise<void> {
    await this.page.locator(this.emailInput).first().fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.locator(this.passwordInput).first().fill(password);
  }

  async submitWithEnterKey(): Promise<void> {
    await this.page.locator(this.passwordInput).first().press("Enter");
    await this.waitForReady();
    await this.page
      .locator("body")
      .waitFor({ state: "visible", timeout: 15000 });
    await this.page.waitForFunction(
      () => !document.body.innerText.includes("Hold on"),
      { timeout: 15000 }
    );
  }

  async isEmailAutoFocused(): Promise<boolean> {
    // Check after page load whether email input has focus
    return this.page.evaluate(() => {
      const active = document.activeElement;
      return (
        active?.tagName === "INPUT" &&
        ((active as HTMLInputElement).type === "email" ||
          active?.id === "login-email" ||
          active?.closest("#login-email") !== null)
      );
    });
  }

  // ── Accessibility ──────────────────────────────────────────────────────

  async getEmailAccessibleName(): Promise<string> {
    const input = this.page.locator(this.emailInput).first();
    // Check aria-label, then associated label
    const ariaLabel = await input.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.trim();
    const placeholder = await input.getAttribute("placeholder");
    if (placeholder) return placeholder.trim();
    // Check for associated <label> via id
    const id = await input.getAttribute("id");
    if (id) {
      const label = this.page.locator(`label[for="${id}"]`);
      if (await label.count() > 0) {
        return (await label.textContent())?.trim() || "";
      }
    }
    return "";
  }

  async getPasswordAccessibleName(): Promise<string> {
    const input = this.page.locator(this.passwordInput).first();
    const ariaLabel = await input.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.trim();
    const placeholder = await input.getAttribute("placeholder");
    if (placeholder) return placeholder.trim();
    const id = await input.getAttribute("id");
    if (id) {
      const label = this.page.locator(`label[for="${id}"]`);
      if (await label.count() > 0) {
        return (await label.textContent())?.trim() || "";
      }
    }
    return "";
  }

  async getSubmitButtonAccessibleName(): Promise<string> {
    return (
      (await this.page
        .locator(this.submitButton)
        .first()
        .textContent())?.trim() || ""
    );
  }

  async hasErrorAriaAnnouncement(): Promise<boolean> {
    // Check if any error element uses role="alert" or aria-live
    const alertRole = this.page.locator('[role="alert"]');
    if ((await alertRole.count()) > 0) return true;
    const ariaLive = this.page.locator("[aria-live]");
    if ((await ariaLive.count()) > 0) return true;
    return false;
  }

  // ── Error handling helpers ─────────────────────────────────────────────

  async clickSubmitTimes(times: number): Promise<void> {
    const btn = this.page.locator(this.submitButton).first();
    await btn.scrollIntoViewIfNeeded();
    for (let i = 0; i < times; i++) {
      await btn.dispatchEvent("click");
    }
  }

  async countAuthApiCalls(): Promise<number> {
    // Count how many auth-related API requests were made
    return this.page.evaluate(() => {
      const entries = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      return entries.filter(
        (e) =>
          e.initiatorType === "fetch" || e.initiatorType === "xmlhttprequest"
      ).length;
    });
  }

  // ── Session helpers ────────────────────────────────────────────────────

  async hasAuthTokenStored(): Promise<boolean> {
    return this.page.evaluate(() => {
      // Check localStorage for common token keys
      const keys = Object.keys(localStorage);
      const tokenKeys = keys.filter(
        (k) =>
          /token|auth|session|access|refresh|jwt/i.test(k) ||
          (localStorage.getItem(k)?.length || 0) > 50
      );
      if (tokenKeys.length > 0) return true;
      // Check cookies
      return document.cookie.length > 0;
    });
  }
}
