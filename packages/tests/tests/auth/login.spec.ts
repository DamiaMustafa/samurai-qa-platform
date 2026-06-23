import { test, expect } from "../../src/fixtures";

test.describe("Login Page @smoke @auth", () => {
  test("should display the login page", async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.expectLoginPage();
    const isFormVisible = await loginPage.isLoginFormVisible();
    expect(isFormVisible).toBe(true);
  });

  test("should show error with invalid credentials", async ({ loginPage }) => {
    await loginPage.loginWithInvalidCredentials();
    await loginPage.expectLoginError();
  });

  test("should login successfully with valid admin credentials", async ({
    loginPage,
  }) => {
    // This test requires ADMIN_USERNAME and ADMIN_PASSWORD in .env
    test.skip(
      !process.env.ADMIN_USERNAME,
      "Admin credentials not configured"
    );

    await loginPage.loginAs("admin");
    await loginPage.expectSuccessfulLogin();
  });

  test("should login successfully with valid standard credentials", async ({
    loginPage,
  }) => {
    test.skip(
      !process.env.STANDARD_USERNAME,
      "Standard user credentials not configured"
    );

    await loginPage.loginAs("standard");
    await loginPage.expectSuccessfulLogin();
  });

  test("login form should have email and password fields", async ({
    loginPage,
  }) => {
    await loginPage.goto();

    // Use page object methods instead of raw selectors
    const emailVisible = await loginPage.isEmailInputVisible();
    const passwordVisible = await loginPage.isPasswordInputVisible();
    const submitVisible = await loginPage.isSubmitButtonVisible();

    expect(emailVisible).toBe(true);
    expect(passwordVisible).toBe(true);
    expect(submitVisible).toBe(true);
  });

  test("should display forgot password link", async ({ loginPage }) => {
    await loginPage.goto();
    const forgotVisible = await loginPage.isForgotPasswordLinkVisible();
    expect(forgotVisible).toBe(true);
  });
});
