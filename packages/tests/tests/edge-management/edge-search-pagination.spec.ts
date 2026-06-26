import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockEdgeDeviceList,
  mockAllEdgeAPIs,
} from "../../src/helpers/edge-management-helpers";

/**
 * Edge Management — Search & Pagination Tests
 *
 * Test Matrix (7 tests):
 *
 *   Block 1: Search @edge @search (3 tests)
 *     1.  search filters devices by name
 *     2.  search with no match shows empty table
 *     3.  clear search restores all devices
 *
 *   Block 2: Pagination @edge @pagination (4 tests)
 *     4.  next page loads more devices (when available)
 *     5.  previous page navigates back
 *     6.  next button disabled on last page
 *     7.  previous button disabled on first page
 */

// ─── Block 1: Search ───────────────────────────────────────────────────────────

test.describe("Block 1: Edge Search @edge @search", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  const mockDevices = createMockEdgeDeviceList(5);

  test.beforeEach(async ({ loginPage, edgeManagementPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllEdgeAPIs(page, mockDevices);
    await edgeManagementPage.goto();
  });

  test("search filters devices by name", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const initialRowCount = await edgeManagementPage.getTableRowCount();
    expect(initialRowCount).toBeGreaterThan(0);

    await edgeManagementPage.fillSearch("A");
    const filteredRowCount = await edgeManagementPage.getTableRowCount();

    expect(filteredRowCount).toBeLessThan(initialRowCount);
    expect(filteredRowCount).toBeGreaterThan(0);

    consoleErrors.assertNoErrors();
  });

  test("search with no match shows empty table", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    await edgeManagementPage.fillSearch("xyzdefinitelynotfound");
    const rowCount = await edgeManagementPage.getTableRowCount();

    expect(rowCount).toBe(0);

    consoleErrors.assertNoErrors();
  });

  test("clear search restores all devices", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const initialRowCount = await edgeManagementPage.getTableRowCount();
    expect(initialRowCount).toBeGreaterThan(0);

    await edgeManagementPage.fillSearch("A");
    const filteredRowCount = await edgeManagementPage.getTableRowCount();
    expect(filteredRowCount).toBeLessThan(initialRowCount);

    await edgeManagementPage.clearSearch();
    const restoredRowCount = await edgeManagementPage.getTableRowCount();

    expect(restoredRowCount).toBe(initialRowCount);

    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Pagination ───────────────────────────────────────────────────────

test.describe("Block 2: Edge Pagination @edge @pagination", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  const mockDevices = createMockEdgeDeviceList(15);

  test.beforeEach(async ({ loginPage, edgeManagementPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllEdgeAPIs(page, mockDevices);
    await edgeManagementPage.goto();
  });

  test("next page loads more devices (when available)", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const page1RowCount = await edgeManagementPage.getTableRowCount();
    test.skip(page1RowCount === 0, "No devices loaded on page 1");
    expect(page1RowCount).toBe(10);

    const nextEnabled = !(await edgeManagementPage.isNextPageDisabled());
    expect(nextEnabled).toBe(true);

    await edgeManagementPage.clickNextPage();
    const page2RowCount = await edgeManagementPage.getTableRowCount();

    expect(page2RowCount).toBe(5);

    consoleErrors.assertNoErrors();
  });

  test("previous page navigates back", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const page1RowCount = await edgeManagementPage.getTableRowCount();
    test.skip(page1RowCount === 0, "No devices loaded on page 1");

    await edgeManagementPage.clickNextPage();
    const page2RowCount = await edgeManagementPage.getTableRowCount();
    expect(page2RowCount).toBeLessThan(page1RowCount);

    const prevEnabled = !(await edgeManagementPage.isPrevPageDisabled());
    expect(prevEnabled).toBe(true);

    await edgeManagementPage.clickPrevPage();
    const backToPage1RowCount = await edgeManagementPage.getTableRowCount();

    expect(backToPage1RowCount).toBe(page1RowCount);

    consoleErrors.assertNoErrors();
  });

  test("next button disabled on last page", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const page1RowCount = await edgeManagementPage.getTableRowCount();
    test.skip(page1RowCount === 0, "No devices loaded on page 1");

    await edgeManagementPage.clickNextPage();
    const nextDisabled = await edgeManagementPage.isNextPageDisabled();

    expect(nextDisabled).toBe(true);

    consoleErrors.assertNoErrors();
  });

  test("previous button disabled on first page", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const page1RowCount = await edgeManagementPage.getTableRowCount();
    test.skip(page1RowCount === 0, "No devices loaded on page 1");

    const prevDisabled = await edgeManagementPage.isPrevPageDisabled();

    expect(prevDisabled).toBe(true);

    consoleErrors.assertNoErrors();
  });
});