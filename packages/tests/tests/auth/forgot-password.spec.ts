import { test, expect } from "../../src/fixtures";

// ─── Block 1: Forgot Password Page Layout (Step 1) ────────────────────────────
test.describe("Forgot Password - Layout @forgot-password @smoke", () => {
  test.beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.goto();
  });

  test("should load the forgot password page", async ({ forgotPasswordPage, consoleErrors }) => {
    const loaded = await forgotPasswordPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the email input", async ({ forgotPasswordPage, consoleErrors }) => {
    const visible = await forgotPasswordPage.isEmailInputVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the request button", async ({ forgotPasswordPage, consoleErrors }) => {
    const visible = await forgotPasswordPage.isRequestButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the cancel button", async ({ forgotPasswordPage, consoleErrors }) => {
    const visible = await forgotPasswordPage.isCancelRequestButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Forgot Password Validation ──────────────────────────────────────
test.describe("Forgot Password - Validation @forgot-password @validation", () => {
  test.beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.goto();
  });

  test("request button should be disabled when email is empty", async ({ forgotPasswordPage, consoleErrors }) => {
    const disabled = await forgotPasswordPage.isRequestButtonDisabled();
    expect(disabled).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should fill email and enable request button", async ({ forgotPasswordPage, consoleErrors }) => {
    await forgotPasswordPage.fillEmail("test@example.com");
    const disabled = await forgotPasswordPage.isRequestButtonDisabled();
    expect(disabled).toBe(false);
    consoleErrors.assertNoErrors();
  });

  test("cancel should navigate back to sign in", async ({ forgotPasswordPage, consoleErrors }) => {
    await forgotPasswordPage.clickCancelRequest();
    await forgotPasswordPage.expectSignInNavigation();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Console Errors ──────────────────────────────────────────────────
test.describe("Forgot Password - Console Errors @forgot-password @console", () => {
  test.beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.goto();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
