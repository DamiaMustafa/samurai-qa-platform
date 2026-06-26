/**
 * Edge Management - Delete Device Tests
 * @edge @delete
 *
 * Test Matrix (6 tests):
 *   1. kebab menu opens with delete option
 *   2. delete option triggers confirmation dialog
 *   3. confirm dialog shows device name in text
 *   4. proceed removes device from table
 *   5. cancel keeps device in table
 *   6. 503 error on delete treated as success
 */

import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockEdgeDeviceList,
  mockAllEdgeAPIs,
  mockDeleteDeployment,
} from "../../src/helpers/edge-management-helpers";

const mockDevices = createMockEdgeDeviceList(3);

test.describe("Delete Device @edge @delete", () => {
  test.beforeEach(async ({ loginPage, edgeManagementPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockAllEdgeAPIs(page, mockDevices);
    await edgeManagementPage.goto();
  });

  test("kebab menu opens with delete option", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No devices");

    await edgeManagementPage.openRowMenu(0);
    const deleteVisible = await edgeManagementPage.isDeleteOptionVisible();
    expect(deleteVisible).toBe(true);

    consoleErrors.assertNoErrors();
  });

  test("delete option triggers confirmation dialog", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No devices");

    await edgeManagementPage.openRowMenu(0);
    await edgeManagementPage.clickDeleteDevice();
    await page.waitForTimeout(1000);

    const dialogVisible = await edgeManagementPage.isDeleteDialogVisible();
    expect(dialogVisible).toBe(true);

    consoleErrors.assertNoErrors();
  });

  test("confirm dialog shows device name in text", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No devices");

    await edgeManagementPage.openRowMenu(0);
    await edgeManagementPage.clickDeleteDevice();
    await page.waitForTimeout(1000);

    const nameInDialog = await edgeManagementPage.isDialogTextVisible(
      mockDevices[0].GreengrassGroupName
    );
    expect(nameInDialog).toBe(true);

    consoleErrors.assertNoErrors();
  });

  test("proceed removes device from table", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    mockDeleteDeployment(page, 200);

    const initialCount = await edgeManagementPage.getTableRowCount();
    test.skip(initialCount === 0, "No devices");

    await edgeManagementPage.openRowMenu(0);
    await edgeManagementPage.clickDeleteDevice();
    await page.waitForTimeout(1000);

    await edgeManagementPage.clickProceed();
    await page.waitForTimeout(2000);

    const newCount = await edgeManagementPage.getTableRowCount();
    expect(newCount).toBe(initialCount - 1);

    consoleErrors.assertNoErrors();
  });

  test("cancel keeps device in table", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    const initialCount = await edgeManagementPage.getTableRowCount();
    test.skip(initialCount === 0, "No devices");

    await edgeManagementPage.openRowMenu(0);
    await edgeManagementPage.clickDeleteDevice();
    await page.waitForTimeout(1000);

    await edgeManagementPage.clickDialogCancel();
    await page.waitForTimeout(1000);

    const newCount = await edgeManagementPage.getTableRowCount();
    expect(newCount).toBe(initialCount);

    consoleErrors.assertNoErrors();
  });

  test("503 error on delete treated as success", async ({
    edgeManagementPage,
    page,
    consoleErrors,
  }) => {
    mockDeleteDeployment(page, 503);

    const initialCount = await edgeManagementPage.getTableRowCount();
    test.skip(initialCount === 0, "No devices");

    await edgeManagementPage.openRowMenu(0);
    await edgeManagementPage.clickDeleteDevice();
    await page.waitForTimeout(1000);

    await edgeManagementPage.clickProceed();
    await page.waitForTimeout(2000);

    const newCount = await edgeManagementPage.getTableRowCount();
    expect(newCount).toBe(initialCount - 1);

    consoleErrors.assertNoErrors();
  });
});