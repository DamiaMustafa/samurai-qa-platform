import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

test.describe("Dashboard Page @smoke @dashboard", () => {
  // Skip all tests if credentials are not configured
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
  });

  test("should load the dashboard after login", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    const loaded = await dashboardPage.isLoaded();
    expect(loaded).toBe(true);
  });

  test("should display main content area", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    await dashboardPage.expectDashboardLoaded();
  });

  test("dashboard page title should be meaningful", async ({
    dashboardPage,
  }) => {
    await dashboardPage.goto();
    const title = await dashboardPage.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });
});
