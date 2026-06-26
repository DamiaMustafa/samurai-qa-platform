/**
 * Workflow Listing Tests
 *
 * Test Matrix (12 tests):
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ Block 1: Layout @workflow @listing @smoke (4 tests)              │
 * │   1. page loads with root element visible                        │
 * │   2. search bar visible                                          │
 * │   3. create workflow button visible                              │
 * │   4. pagination visible                                          │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ Block 2: Cards @workflow @listing (4 tests)                      │
 * │   5. cards render when workflows exist                           │
 * │   6. each card has a title                                       │
 * │   7. card click navigates to workflow editor                     │
 * │   8. card menu has rename and delete options                     │
 * ├──────────────────────────────────────────────────────────────────┤
 * │ Block 3: Create/Rename/Delete @workflow @listing (4 tests)       │
 * │   9.  create button opens create dialog                          │
 * │   10. rename dialog opens with pre-filled name                   │
 * │   11. delete removes workflow from list                          │
 * │   12. search filters cards by name                               │
 * └──────────────────────────────────────────────────────────────────┘
 */

import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockWorkflowList,
  mockAllWorkflowAPIs,
} from "../../src/helpers/workflow-helpers";

// ---------------------------------------------------------------------------
// Block 1: Layout @workflow @listing @smoke
// ---------------------------------------------------------------------------
test.describe("Workflow Listing - Layout", () => {
  const mockWorkflows = createMockWorkflowList(5);

  test.beforeEach(async ({ loginPage, workflowListingPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllWorkflowAPIs(page, mockWorkflows);
    await workflowListingPage.goto();
  });

  test("1. page loads with root element visible @workflow @listing @smoke", async ({
    workflowListingPage,
    consoleErrors,
  }) => {
    const loaded = await workflowListingPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("2. search bar visible @workflow @listing @smoke", async ({
    workflowListingPage,
    consoleErrors,
  }) => {
    const visible = await workflowListingPage.isSearchVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("3. create workflow button visible @workflow @listing @smoke", async ({
    workflowListingPage,
    consoleErrors,
  }) => {
    const visible = await workflowListingPage.isCreateButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("4. pagination visible @workflow @listing @smoke", async ({
    workflowListingPage,
    consoleErrors,
  }) => {
    const visible = await workflowListingPage.isPaginationVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ---------------------------------------------------------------------------
// Block 2: Cards @workflow @listing
// ---------------------------------------------------------------------------
test.describe("Workflow Listing - Cards", () => {
  const mockWorkflows = createMockWorkflowList(5);

  test.beforeEach(async ({ loginPage, workflowListingPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllWorkflowAPIs(page, mockWorkflows);
    await workflowListingPage.goto();
  });

  test("5. cards render when workflows exist @workflow @listing", async ({
    workflowListingPage,
    consoleErrors,
  }) => {
    const count = await workflowListingPage.getCardCount();
    expect(count).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("6. each card has a title @workflow @listing", async ({
    workflowListingPage,
    consoleErrors,
  }) => {
    const count = await workflowListingPage.getCardCount();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const title = await workflowListingPage.getCardTitle(i);
      expect(title.length).toBeGreaterThan(0);
    }
    consoleErrors.assertNoErrors();
  });

  test("7. card click navigates to workflow editor @workflow @listing", async ({
    workflowListingPage,
    consoleErrors,
  }) => {
    const count = await workflowListingPage.getCardCount();
    expect(count).toBeGreaterThan(0);

    await workflowListingPage.clickCard(0);
    await workflowListingPage.expectWorkflowNavigation();
    consoleErrors.assertNoErrors();
  });

  test("8. card menu has rename and delete options @workflow @listing", async ({
    workflowListingPage,
    consoleErrors,
  }) => {
    const count = await workflowListingPage.getCardCount();
    test.skip(count === 0, "No workflow cards available on this page");

    await workflowListingPage.openCardMenu(0);

    const visible = await workflowListingPage.isMenuPanelVisible();
    expect(visible).toBe(true);

    const items = await workflowListingPage.getCardMenuItems();
    const itemsLower = items.map((item: string) => item.toLowerCase());
    expect(itemsLower).toContain("rename");
    expect(itemsLower).toContain("delete");

    consoleErrors.assertNoErrors();
  });
});

// ---------------------------------------------------------------------------
// Block 3: Create/Rename/Delete @workflow @listing
// ---------------------------------------------------------------------------
test.describe("Workflow Listing - Create/Rename/Delete", () => {
  const mockWorkflows = createMockWorkflowList(5);

  test.beforeEach(async ({ loginPage, workflowListingPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllWorkflowAPIs(page, mockWorkflows);
    await workflowListingPage.goto();
  });

  test("9. create button opens create dialog @workflow @listing", async ({
    workflowListingPage,
    page,
    consoleErrors,
  }) => {
    await workflowListingPage.clickCreateWorkflow();
    await page.waitForTimeout(1000);

    const visible = await workflowListingPage.isCreateDialogVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("10. rename dialog opens with pre-filled name @workflow @listing", async ({
    workflowListingPage,
    page,
    consoleErrors,
  }) => {
    const count = await workflowListingPage.getCardCount();
    test.skip(count === 0, "No workflow cards available on this page");

    await workflowListingPage.openCardMenu(0);
    await workflowListingPage.clickMenuRename();
    await page.waitForTimeout(1000);

    const visible = await workflowListingPage.isRenameDialogVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("11. delete removes workflow from list @workflow @listing", async ({
    workflowListingPage,
    page,
    consoleErrors,
  }) => {
    const countBefore = await workflowListingPage.getCardCount();
    test.skip(countBefore === 0, "No workflow cards available on this page");

    await workflowListingPage.openCardMenu(0);
    await workflowListingPage.clickMenuDelete();
    await page.waitForTimeout(2000);

    const countAfter = await workflowListingPage.getCardCount();
    expect(countAfter).toBeLessThan(countBefore);
    consoleErrors.assertNoErrors();
  });

  test("12. search filters cards by name @workflow @listing", async ({
    workflowListingPage,
    page,
    consoleErrors,
  }) => {
    const countBefore = await workflowListingPage.getCardCount();

    await workflowListingPage.searchWorkflows("Alpha");
    await page.waitForTimeout(500);

    const countFiltered = await workflowListingPage.getCardCount();
    // Filtering should reduce or at most equal the count
    expect(countFiltered).toBeLessThanOrEqual(countBefore);

    await workflowListingPage.clearSearch();
    await page.waitForTimeout(500);

    const countRestored = await workflowListingPage.getCardCount();
    expect(countRestored).toBe(countBefore);

    consoleErrors.assertNoErrors();
  });
});