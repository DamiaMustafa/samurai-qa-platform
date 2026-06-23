import { test, expect } from "../../src/fixtures";

test.describe("Dashboard Page @smoke @dashboard", () => {
  // Skip all tests if credentials are not configured
  test.skip(
    !process.env.ADMIN_USERNAME,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAs("admin");
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
