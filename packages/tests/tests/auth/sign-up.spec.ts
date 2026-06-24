import { test, expect } from "../../src/fixtures";

// ─── Block 1: Sign Up Page Layout ─────────────────────────────────────────────
test.describe("Sign Up - Layout @sign-up @smoke", () => {
  test.beforeEach(async ({ signUpPage }) => {
    await signUpPage.goto();
  });

  test("should load the sign up page", async ({ signUpPage, consoleErrors }) => {
    const loaded = await signUpPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the email input", async ({ signUpPage, consoleErrors }) => {
    const visible = await signUpPage.isEmailVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the password input", async ({ signUpPage, consoleErrors }) => {
    const visible = await signUpPage.isPasswordVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the confirm password input", async ({ signUpPage, consoleErrors }) => {
    const visible = await signUpPage.isConfirmPasswordVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the submit button", async ({ signUpPage, consoleErrors }) => {
    const visible = await signUpPage.isSubmitButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the sign in link", async ({ signUpPage, consoleErrors }) => {
    const visible = await signUpPage.isSignInLinkVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Sign Up Form Validation ─────────────────────────────────────────
test.describe("Sign Up - Validation @sign-up @validation", () => {
  test.beforeEach(async ({ signUpPage }) => {
    await signUpPage.goto();
  });

  test("submit button should be disabled when form is empty", async ({ signUpPage, consoleErrors }) => {
    const disabled = await signUpPage.isSubmitButtonDisabled();
    expect(disabled).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should fill email field", async ({ signUpPage, consoleErrors }) => {
    await signUpPage.fillEmail("test@example.com");
    consoleErrors.assertNoErrors();
  });

  test("should fill password fields", async ({ signUpPage, consoleErrors }) => {
    await signUpPage.fillPassword("TestPass123!");
    await signUpPage.fillConfirmPassword("TestPass123!");
    consoleErrors.assertNoErrors();
  });

  test("clicking sign in link should navigate to sign in", async ({ signUpPage, consoleErrors }) => {
    await signUpPage.clickSignInLink();
    await signUpPage.expectSignInNavigation();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Console Errors ──────────────────────────────────────────────────
test.describe("Sign Up - Console Errors @sign-up @console", () => {
  test.beforeEach(async ({ signUpPage }) => {
    await signUpPage.goto();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
