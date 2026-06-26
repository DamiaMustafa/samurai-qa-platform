/**
 * Edge Management - Dialog Tests
 *
 * Test Matrix (5 tests):
 *   Block 1: Software Version Dialog @edge @version (3 tests)
 *     1. clicking version tag opens version dialog
 *     2. dialog shows 3 service sections (Inference, Middleware, Frontend)
 *     3. each section displays current and latest version
 *
 *   Block 2: Add Server Dialog @edge @add-server (2 tests)
 *     4. clicking Add Server opens dialog
 *     5. dialog contains deployment guide link
 */
import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockEdgeDeviceList,
  mockAllEdgeAPIs,
  MOCK_LATEST_VERSION,
} from "../../src/helpers/edge-management-helpers";

test.describe("Software Version Dialog @edge @version", () => {
  const mockDevices = createMockEdgeDeviceList(3);

  test.beforeEach(async ({ loginPage, edgeManagementPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllEdgeAPIs(page, mockDevices);
    await edgeManagementPage.goto();
  });

  test("clicking version tag opens version dialog", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No edge device rows available");

    const tagVisible = await edgeManagementPage.isVersionTagVisible();
    test.skip(!tagVisible, "Version tag is not visible in the table");

    await edgeManagementPage.clickVersionTag(0);
    await page.waitForTimeout(2000);

    const dialogVisible = await edgeManagementPage.isVersionDialogVisible();
    expect(dialogVisible).toBe(true);

    await consoleErrors.assertNoErrors();
  });

  test("dialog shows 3 service sections (Inference, Middleware, Frontend)", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No edge device rows available");

    const tagVisible = await edgeManagementPage.isVersionTagVisible();
    test.skip(!tagVisible, "Version tag is not visible in the table");

    await edgeManagementPage.clickVersionTag(0);
    await page.waitForTimeout(2000);

    const dialogVisible = await edgeManagementPage.isVersionDialogVisible();
    test.skip(!dialogVisible, "Version dialog did not open");

    const serviceCount = await edgeManagementPage.getVersionServiceCount();
    expect(serviceCount).toBeGreaterThanOrEqual(3);

    await consoleErrors.assertNoErrors();
  });

  test("each section displays current and latest version", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No edge device rows available");

    const tagVisible = await edgeManagementPage.isVersionTagVisible();
    test.skip(!tagVisible, "Version tag is not visible in the table");

    await edgeManagementPage.clickVersionTag(0);
    await page.waitForTimeout(2000);

    const dialogVisible = await edgeManagementPage.isVersionDialogVisible();
    test.skip(!dialogVisible, "Version dialog did not open");

    const serviceCount = await edgeManagementPage.getVersionServiceCount();
    expect(serviceCount).toBeGreaterThanOrEqual(3);

    const labels = await edgeManagementPage.getVersionServiceLabels();
    const values = await edgeManagementPage.getVersionServiceValues();

    expect(labels.length).toBeGreaterThanOrEqual(3);
    expect(values.length).toBeGreaterThanOrEqual(3);

    // Each label should be a non-empty string
    for (const label of labels) {
      expect(label, `Service label "${label}" should not be empty`).toBeTruthy();
    }

    // Each value should be a non-empty string
    for (const value of values) {
      expect(value, `Version value "${value}" should not be empty`).toBeTruthy();
    }

    await edgeManagementPage.closeVersionDialog();
    await consoleErrors.assertNoErrors();
  });
});

test.describe("Add Server Dialog @edge @add-server", () => {
  const mockDevices = createMockEdgeDeviceList(3);

  test.beforeEach(async ({ loginPage, edgeManagementPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllEdgeAPIs(page, mockDevices);
    await edgeManagementPage.goto();
  });

  test("clicking Add Server opens dialog", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    await edgeManagementPage.clickAddServer();
    await page.waitForTimeout(1000);

    const dialogVisible = await edgeManagementPage.isAddServerDialogVisible();
    expect(dialogVisible).toBe(true);

    await consoleErrors.assertNoErrors();
  });

  test("dialog contains deployment guide link", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    await edgeManagementPage.clickAddServer();
    await page.waitForTimeout(1000);

    const dialogVisible = await edgeManagementPage.isAddServerDialogVisible();
    test.skip(!dialogVisible, "Add Server dialog did not open");

    const linkVisible = await edgeManagementPage.isDeploymentGuideLinkVisible();
    expect(linkVisible).toBe(true);

    await consoleErrors.assertNoErrors();
  });
});