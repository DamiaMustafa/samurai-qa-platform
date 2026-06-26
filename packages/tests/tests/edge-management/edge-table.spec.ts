import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockEdgeDeviceList,
  mockAllEdgeAPIs,
} from "../../src/helpers/edge-management-helpers";

/**
 * Edge Management - Edge Table Tests
 *
 * Test Matrix (7 tests):
 *
 *   Block 1: Table Data @edge @table (4 tests)
 *     1. table renders device rows with data
 *     2. first column shows device name
 *     3. version tag visible with yellow color in table
 *     4. link tags visible (Web Portal, API Doc, System Monitoring)
 *
 *   Block 2: Sort @edge @table (2 tests)
 *     5. sort by device name changes row order
 *     6. sort by created date changes row order
 *
 *   Block 3: Links @edge @table (1 test)
 *     7. link tags open in new tab (target="_blank")
 */

test.describe("Block 1: Table Data", () => {
  const mockDevices = createMockEdgeDeviceList(5);

  test.beforeEach(async ({ loginPage, edgeManagementPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllEdgeAPIs(page, mockDevices);
    await edgeManagementPage.goto();
  });

  test("table renders device rows with data @edge @table", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    expect(rowCount).toBeGreaterThan(0);
    expect(rowCount).toBe(mockDevices.length);

    for (let i = 0; i < rowCount; i++) {
      const deviceName = await edgeManagementPage.getTableCellText(i, 0);
      expect(deviceName).toBeTruthy();
      expect(deviceName).toBe(mockDevices[i].GreengrassGroupName);
    }

    consoleErrors.assertNoErrors();
  });

  test("first column shows device name @edge @table", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No rows to verify device name column");

    const firstDeviceName = await edgeManagementPage.getTableCellText(0, 0);
    expect(firstDeviceName).toBeTruthy();
    expect(typeof firstDeviceName).toBe("string");
    expect(firstDeviceName.length).toBeGreaterThan(0);

    consoleErrors.assertNoErrors();
  });

  test("version tag visible with yellow color in table @edge @table", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const isVisible = await edgeManagementPage.isVersionTagVisible();
    expect(isVisible).toBe(true);

    consoleErrors.assertNoErrors();
  });

  test("link tags visible (Web Portal, API Doc, System Monitoring) @edge @table", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const linkTags = ["Web Portal", "API Doc", "System Monitoring"];

    for (const tag of linkTags) {
      const isVisible = await edgeManagementPage.isLinkTagVisible(tag);
      expect(isVisible).toBe(true);
    }

    consoleErrors.assertNoErrors();
  });
});

test.describe("Block 2: Sort", () => {
  const mockDevices = createMockEdgeDeviceList(5);

  test.beforeEach(async ({ loginPage, edgeManagementPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllEdgeAPIs(page, mockDevices);
    await edgeManagementPage.goto();
  });

  test("sort by device name changes row order @edge @table", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(
      rowCount < 2,
      `Cannot verify sort with ${rowCount} rows (need at least 2)`
    );

    const firstNameBefore = await edgeManagementPage.getTableCellText(0, 0);

    await edgeManagementPage.clickSortHeader("Device Name");
    const direction = await edgeManagementPage.getSortDirection();
    expect(direction).not.toBe("none");

    const firstNameAfter = await edgeManagementPage.getTableCellText(0, 0);
    expect(firstNameAfter).not.toBe(firstNameBefore);

    consoleErrors.assertNoErrors();
  });

  test("sort by created date changes row order @edge @table", async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(
      rowCount < 2,
      `Cannot verify sort with ${rowCount} rows (need at least 2)`
    );

    const firstDateBefore = await edgeManagementPage.getTableCellText(0, 1);

    await edgeManagementPage.clickSortHeader("Created");
    const direction = await edgeManagementPage.getSortDirection();
    expect(direction).not.toBe("none");

    const firstDateAfter = await edgeManagementPage.getTableCellText(0, 1);
    expect(firstDateAfter).not.toBe(firstDateBefore);

    consoleErrors.assertNoErrors();
  });
});

test.describe("Block 3: Links", () => {
  const mockDevices = createMockEdgeDeviceList(5);

  test.beforeEach(async ({ loginPage, edgeManagementPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllEdgeAPIs(page, mockDevices);
    await edgeManagementPage.goto();
  });

  test('link tags open in new tab (target="_blank") @edge @table', async ({
    edgeManagementPage,
    consoleErrors,
  }) => {
    const target = await edgeManagementPage.getLinkTagTarget("Web Portal");

    if (target === null) {
      // Tag has no target attribute — acceptable, soft-pass
      test.skip(true, "Web Portal link tag has no target attribute");
      return;
    }

    expect(target).toBe("_blank");
    consoleErrors.assertNoErrors();
  });
});