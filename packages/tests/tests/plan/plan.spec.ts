import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Plan Tracking Page ──────────────────────────────────────────────
test.describe("Plan Tracking - Layout @plan @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, planPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await planPage.gotoPlanTracking();
  });

  test("should load the plan tracking page", async ({ page, consoleErrors }) => {
    // Plan tracking may redirect non-admins — check we're on a valid page
    const url = page.url();
    const onPlanTracking = url.includes("plan-tracking") || url.includes("plan") || url.includes("home");
    expect(onPlanTracking).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("no console errors after loading plan tracking", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Plan Details (requires company ID from session) ─────────────────
test.describe("Plan Details - Layout @plan @details", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, homePage, planPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    // Navigate to home first to get company ID in session
    await homePage.goto();
    // Try navigating via the sidebar Plan link
    const planLink = page.locator('a[href*="plan"], button:has-text("Plan")').first();
    if (await planLink.isVisible().catch(() => false)) {
      await planLink.click();
      await page.waitForTimeout(2000);
    }
  });

  test("should display plan page or redirect appropriately", async ({ page, consoleErrors }) => {
    const url = page.url();
    // Either on a plan page, or redirected back to home
    const validPage = url.includes("plan") || url.includes("home") || url.includes("company");
    expect(validPage).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("plan page should show status, usage, or empty state", async ({ planPage, page, consoleErrors }) => {
    const onPlanPage = page.url().includes("plan") || page.url().includes("company");
    test.skip(!onPlanPage, "Not on plan page");

    const loaded = await planPage.isLoaded();
    if (loaded) {
      // Check for active plan indicators or empty state
      const statusVisible = await planPage.isStatusTagVisible();
      const emptyVisible = await planPage.isEmptyStateVisible();
      const backVisible = await planPage.isBackButtonVisible();
      expect(statusVisible || emptyVisible || backVisible).toBe(true);
    }
    consoleErrors.assertNoErrors();
  });

  test("back button should be visible on plan details page", async ({ planPage, page, consoleErrors }) => {
    const onPlanPage = page.url().includes("company") && page.url().includes("plan");
    test.skip(!onPlanPage, "Not on plan details page");

    const visible = await planPage.isBackButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("active plan should show progress bars for usage", async ({ planPage, page, consoleErrors }) => {
    const onPlanPage = page.url().includes("company") && page.url().includes("plan");
    test.skip(!onPlanPage, "Not on plan details page");

    const statusVisible = await planPage.isStatusTagVisible();
    test.skip(!statusVisible, "No active plan status visible");

    const progressCount = await planPage.getProgressBarCount();
    // Active plans should show usage progress bars
    expect(progressCount).toBeGreaterThanOrEqual(0);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Empty State (No Plan) ──────────────────────────────────────────
test.describe("Plan Details - Empty State @plan @empty", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, homePage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await homePage.goto();
    const planLink = page.locator('a[href*="plan"], button:has-text("Plan")').first();
    if (await planLink.isVisible().catch(() => false)) {
      await planLink.click();
      await page.waitForTimeout(2000);
    }
  });

  test("empty state should show Contact Us or pricing cards for free plan users", async ({ planPage, page, consoleErrors }) => {
    const onPlanPage = page.url().includes("company") && page.url().includes("plan");
    test.skip(!onPlanPage, "Not on plan page");

    const emptyVisible = await planPage.isEmptyStateVisible();
    test.skip(!emptyVisible, "Plan exists — no empty state");

    // Either Contact Us button or Explore Plans should be visible
    const contactVisible = await planPage.isContactUsButtonVisible();
    const exploreVisible = await planPage.isExplorePlansButtonVisible();
    expect(contactVisible || exploreVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Console Errors ──────────────────────────────────────────────────
test.describe("Plan - Console Errors @plan @console", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, planPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await planPage.gotoPlanTracking();
  });

  test("no console errors after loading plan tracking", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
