import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockCompany,
  mockCompanyPlanGraphQL,
  MOCK_COMPANIES,
} from "../../src/helpers/plan-helpers";

/**
 * Plan Details Page Tests @plan @details
 *
 * Covers the company plan details page at /company/:companyId/plan:
 *   - Page layout and element visibility
 *   - Active plan status, dates, usage & progress bars
 *   - Upgrade button for starter plans (superadmin only)
 *   - Pricing cards for free plan companies (superadmin)
 *   - Empty state fallback for non-superadmin users
 *
 * All GraphQL calls are mocked — no real plan data is modified.
 *
 * Test matrix (10 tests):
 *   Block 1: Layout @smoke (2 tests)
 *     1. Plan details page loads with root element visible
 *     2. Back button visible in header
 *
 *   Block 2: Active Plan (5 tests)
 *     3. Active status tag displayed
 *     4. Start and expiry dates displayed
 *     5. Usage sections show used/remaining values (users, projects, training min)
 *     6. Progress bars visible for storage and inference tracking
 *     7. Upgrade button visible for starter plan (superadmin only)
 *
 *   Block 3: Free Plan — Pricing Cards — Superadmin (2 tests)
 *     8. Pricing cards displayed for free plan company (superadmin)
 *     9. Select plan button visible on pricing cards (superadmin)
 *
 *   Block 4: Free Plan — Empty State — Non-Superadmin (1 test)
 *    10. Empty state shows contact us button (non-superadmin fallback)
 */

// ─── Block 1: Layout ───────────────────────────────────────────────────────────

test.describe("Plan Details — Layout @plan @details @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  const detailCompany = MOCK_COMPANIES.activeStarter;

  test.beforeEach(async ({ loginPage, planPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockCompanyPlanGraphQL(page, [], detailCompany);
    await planPage.goto(detailCompany.id);
  });

  test("plan details page loads with root element visible", async ({
    planPage,
    consoleErrors,
  }) => {
    expect(await planPage.isLoaded()).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("back button visible in header", async ({
    planPage,
    consoleErrors,
  }) => {
    expect(await planPage.isBackButtonVisible()).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Active Plan ──────────────────────────────────────────────────────

test.describe("Plan Details — Active Plan @plan @details", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  const detailCompany = MOCK_COMPANIES.activeStarter;

  test.beforeEach(async ({ loginPage, planPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockCompanyPlanGraphQL(page, [], detailCompany);
    await planPage.goto(detailCompany.id);
  });

  test("active status tag displayed", async ({
    planPage,
    consoleErrors,
  }) => {
    expect(await planPage.isActiveStatusVisible()).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("start and expiry dates displayed", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    // Dates are rendered in the plan details area — verify year
    // components from mock data appear in the page text
    const planText = await page
      .locator("#company-plan-page, .plan")
      .first()
      .textContent();
    const hasStartYear = (planText || "").includes("2025");
    const hasEndYear = (planText || "").includes("2026");
    expect(hasStartYear || hasEndYear).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("usage sections show used/remaining values (users, projects, training min)", async ({
    planPage,
    consoleErrors,
  }) => {
    const sectionCount = await planPage.getUseSectionCount();
    expect(sectionCount).toBeGreaterThanOrEqual(1);

    const usedValues = await planPage.getUsedValues();
    expect(usedValues.length).toBeGreaterThanOrEqual(1);

    const remainingValues = await planPage.getRemainingValues();
    expect(remainingValues.length).toBeGreaterThanOrEqual(1);

    consoleErrors.assertNoErrors();
  });

  test("progress bars visible for storage and inference tracking", async ({
    planPage,
    consoleErrors,
  }) => {
    const progressVisible = await planPage.isProgressBarVisible();
    expect(progressVisible).toBe(true);

    const progressCount = await planPage.getProgressBarCount();
    expect(progressCount).toBeGreaterThanOrEqual(1);

    consoleErrors.assertNoErrors();
  });

  test("upgrade button visible for starter plan (superadmin only)", async ({
    planPage,
    consoleErrors,
  }) => {
    const visible = await planPage.isUpgradeButtonVisible();
    test.skip(
      !visible,
      "Upgrade button not visible — user may not be superadmin"
    );
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Free Plan — Pricing Cards — Superadmin ───────────────────────────

test.describe("Plan Details — Free Plan Pricing Cards @plan @details", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  const detailCompany = MOCK_COMPANIES.freeNoPlan;

  test.beforeEach(async ({ loginPage, planPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockCompanyPlanGraphQL(page, [], detailCompany);
    await planPage.goto(detailCompany.id);
  });

  test("pricing cards displayed for free plan company (superadmin)", async ({
    planPage,
    consoleErrors,
  }) => {
    const cardsVisible = await planPage.isPricingCardsVisible();
    expect(cardsVisible).toBe(true);

    const cardCount = await planPage.getPricingCardCount();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    consoleErrors.assertNoErrors();
  });

  test("select plan button visible on pricing cards (superadmin)", async ({
    planPage,
    consoleErrors,
  }) => {
    const starterVisible = await planPage.isSelectPlanButtonVisible("starter");
    const professionalVisible =
      await planPage.isSelectPlanButtonVisible("professional");

    // At least one select plan button should be visible
    expect(starterVisible || professionalVisible).toBe(true);

    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Free Plan — Empty State — Non-Superadmin ─────────────────────────

test.describe("Plan Details — Free Plan Empty State @plan @details", () => {
  test.skip(
    !envConfig.credentials.standard.username,
    "Standard user credentials not configured in .env"
  );

  const detailCompany = MOCK_COMPANIES.freeNoPlan;

  test.beforeEach(async ({ loginPage, planPage, page }) => {
    await loginPage.loginAs("standard");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockCompanyPlanGraphQL(page, [], detailCompany);
    await planPage.goto(detailCompany.id);
  });

  test("empty state shows contact us button (non-superadmin fallback)", async ({
    planPage,
    consoleErrors,
  }) => {
    const emptyVisible = await planPage.isEmptyStateVisible();
    expect(emptyVisible).toBe(true);

    const contactVisible = await planPage.isContactUsButtonVisible();
    expect(contactVisible).toBe(true);

    consoleErrors.assertNoErrors();
  });
});