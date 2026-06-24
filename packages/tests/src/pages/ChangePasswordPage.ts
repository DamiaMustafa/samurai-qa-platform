import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ChangePasswordPage — change password at /change-password (requires auth).
 *
 * DOM reference:
 * - Old password:  <sc-input id="change-password-old-input" type="password">
 * - New password:  <sc-input id="change-password-new-input" type="password">
 * - Confirm:       <sc-input id="change-password-confirm-input" type="password">
 * - Submit:        <button id="change-password-submit-button">
 * - Cancel:        <button id="change-password-cancel-button">
 */
export class ChangePasswordPage extends BasePage {
  private readonly root = "app-change-password, .change-password";
  private readonly oldPasswordInput = "#change-password-old-input";
  private readonly newPasswordInput = "#change-password-new-input";
  private readonly confirmPasswordInput = "#change-password-confirm-input";
  private readonly submitButton = "#change-password-submit-button";
  private readonly cancelButton = "#change-password-cancel-button";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate("/change-password");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.oldPasswordInput).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async isOldPasswordVisible(): Promise<boolean> {
    return this.page.locator(this.oldPasswordInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isNewPasswordVisible(): Promise<boolean> {
    return this.page.locator(this.newPasswordInput).first().isVisible({ timeout: 5000 }).catch(() => false);
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

  async isCancelButtonVisible(): Promise<boolean> {
    return this.page.locator(this.cancelButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async fillOldPassword(password: string): Promise<void> {
    const input = this.page.locator(`${this.oldPasswordInput} input`).first();
    await input.fill(password);
  }

  async fillNewPassword(password: string): Promise<void> {
    const input = this.page.locator(`${this.newPasswordInput} input`).first();
    await input.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    const input = this.page.locator(`${this.confirmPasswordInput} input`).first();
    await input.fill(password);
  }

  async clickSubmit(): Promise<void> {
    await this.page.locator(this.submitButton).first().click();
  }

  async clickCancel(): Promise<void> {
    await this.page.locator(this.cancelButton).first().click();
  }

  async expectHomeNavigation(): Promise<void> {
    await expect(this.page).toHaveURL(/home/, { timeout: 10000 });
  }
}
