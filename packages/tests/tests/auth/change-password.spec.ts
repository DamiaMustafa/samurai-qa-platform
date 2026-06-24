import { test, expect } from "../../src/fixtures";

// ─── Block 1: Change Password Page Layout ────────────────────────────────────
test.describe("Change Password - Layout @change-password @smoke", () => {
  test.beforeEach(async ({ loginPage, changePasswordPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await changePasswordPage.goto();
  });

  test("should load the change password page", async ({ changePasswordPage, consoleErrors }) => {
    const loaded = await changePasswordPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the old password input", async ({ changePasswordPage, consoleErrors }) => {
    const visible = await changePasswordPage.isOldPasswordVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the new password input", async ({ changePasswordPage, consoleErrors }) => {
    const visible = await changePasswordPage.isNewPasswordVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the confirm password input", async ({ changePasswordPage, consoleErrors }) => {
    const visible = await changePasswordPage.isConfirmPasswordVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the submit button", async ({ changePasswordPage, consoleErrors }) => {
    const visible = await changePasswordPage.isSubmitButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the cancel button", async ({ changePasswordPage, consoleErrors }) => {
    const visible = await changePasswordPage.isCancelButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Change Password Validation ─────────────────────────────────────
test.describe("Change Password - Validation @change-password @validation", () => {
  test.beforeEach(async ({ loginPage, changePasswordPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await changePasswordPage.goto();
  });

  test("submit button should be disabled when form is empty", async ({ changePasswordPage, consoleErrors }) => {
    const disabled = await changePasswordPage.isSubmitButtonDisabled();
    expect(disabled).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should fill old password field", async ({ changePasswordPage, consoleErrors }) => {
    await changePasswordPage.fillOldPassword("oldpass123");
    consoleErrors.assertNoErrors();
  });

  test("should fill new password field", async ({ changePasswordPage, consoleErrors }) => {
    await changePasswordPage.fillNewPassword("NewPass123!");
    consoleErrors.assertNoErrors();
  });

  test("should fill confirm password field", async ({ changePasswordPage, consoleErrors }) => {
    await changePasswordPage.fillConfirmPassword("NewPass123!");
    consoleErrors.assertNoErrors();
  });

  test("cancel should navigate back to home", async ({ changePasswordPage, consoleErrors }) => {
    await changePasswordPage.clickCancel();
    await changePasswordPage.expectHomeNavigation();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Console Errors ──────────────────────────────────────────────────
test.describe("Change Password - Console Errors @change-password @console", () => {
  test.beforeEach(async ({ loginPage, changePasswordPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await changePasswordPage.goto();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
