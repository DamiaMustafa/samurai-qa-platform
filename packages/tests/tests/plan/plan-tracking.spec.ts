import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockCompanyList,
  createMockCompany,
  mockCompanyPlanGraphQL,
  MOCK_COMPANIES,
} from "../../src/helpers/plan-helpers";

/**
 * Plan Tracking — List Page Tests @plan @tracking
 *
 * Covers the company plan tracking list at /plan-tracking:
 *   - Page layout and element visibility
 *   - Company table rendering and navigation
 *   - Pagination controls
 *   - Search filtering and clear
 *
 * All GraphQL calls are mocked — no real data is read.
 *
 * Test matrix (9 tests):
 *   Block 1: Layout @plan @tracking @smoke (4 tests)
 *     1. plan tracking page loads with root element visible
 *     2. page title visible in header
 *     3. search bar visible
 *     4. company table visible
 *
 *   Block 2: Table & Pagination @plan @tracking (3 tests)
 *     5. table renders company rows with data
 *     6. table row click navigates to company plan details
 *     7. pagination controls visible
 *
 *   Block 3: Search @plan @tracking (2 tests)
 *     8. search filters table rows
 *     9. search clear restores all rows
 */

// ─── Block 1: Layout ──────────────────────────────────────────────────────────

test.describe(
  "Plan Tracking — Layout @plan @tracking @smoke",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    const mockCompanies = createMockCompanyList();

    test.beforeEach(
      async ({ loginPage, planPage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockCompanyPlanGraphQL(page, mockCompanies, mockCompanies[0]);
        await planPage.gotoPlanTracking();
      }
    );

    test("plan tracking page loads with root element visible", async ({
      planPage,
      consoleErrors,
    }) => {
      expect(await planPage.isPlanTrackingLoaded()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("page title visible in header", async ({
      planPage,
      consoleErrors,
    }) => {
      expect(await planPage.isTrackingTitleVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("search bar visible", async ({
      planPage,
      consoleErrors,
    }) => {
      expect(await planPage.isSearchVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("company table visible", async ({
      planPage,
      consoleErrors,
    }) => {
      expect(await planPage.isTableVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 2: Table & Pagination ─────────────────────────────────────────────

test.describe(
  "Plan Tracking — Table & Pagination @plan @tracking",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    const mockCompanies = createMockCompanyList();

    test.beforeEach(
      async ({ loginPage, planPage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockCompanyPlanGraphQL(page, mockCompanies, mockCompanies[0]);
        await planPage.gotoPlanTracking();
      }
    );

    test("table renders company rows with data", async ({
      planPage,
      consoleErrors,
    }) => {
      const count = await planPage.getTableRowCount();
      expect(count).toBeGreaterThan(0);

      // Verify at least the first cell contains data (company name)
      const firstCellText = await planPage.getTableCellText(0, 0);
      expect(firstCellText.length).toBeGreaterThan(0);
      consoleErrors.assertNoErrors();
    });

    test("table row click navigates to company plan details", async ({
      planPage,
      consoleErrors,
      page,
    }) => {
      await planPage.clickTableRow(0);

      // Should navigate to /company/:id/plan
      await expect(page).toHaveURL(/\/company\/.*\/plan/, {
        timeout: 15_000,
      });
      consoleErrors.assertNoErrors();
    });

    test("pagination controls visible", async ({
      planPage,
      consoleErrors,
    }) => {
      expect(await planPage.isPaginationVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 3: Search ─────────────────────────────────────────────────────────

test.describe(
  "Plan Tracking — Search @plan @tracking",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    const mockCompanies = createMockCompanyList();

    test.beforeEach(
      async ({ loginPage, planPage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockCompanyPlanGraphQL(page, mockCompanies, mockCompanies[0]);
        await planPage.gotoPlanTracking();
      }
    );

    test("search filters table rows", async ({
      planPage,
      consoleErrors,
    }) => {
      const initialCount = await planPage.getTableRowCount();

      // Search for "Acme" — should match only Acme Corp (1 row)
      await planPage.fillSearch("Acme");

      const filteredCount = await planPage.getTableRowCount();
      expect(filteredCount).toBeLessThan(initialCount);
      expect(filteredCount).toBeGreaterThanOrEqual(1);
      consoleErrors.assertNoErrors();
    });

    test("search clear restores all rows", async ({
      planPage,
      consoleErrors,
    }) => {
      const initialCount = await planPage.getTableRowCount();

      await planPage.fillSearch("Acme");
      await planPage.clearSearch();

      const restoredCount = await planPage.getTableRowCount();
      expect(restoredCount).toBe(initialCount);
      consoleErrors.assertNoErrors();
    });
  }
);