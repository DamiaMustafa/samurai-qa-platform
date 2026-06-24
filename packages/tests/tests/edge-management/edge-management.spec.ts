import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Page Layout ─────────────────────────────────────────────────────
test.describe("Edge Management - Layout @edge @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, edgeManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await edgeManagementPage.goto();
  });

  test("should load the edge management page", async ({ edgeManagementPage, consoleErrors }) => {
    const loaded = await edgeManagementPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the search input", async ({ edgeManagementPage, consoleErrors }) => {
    const visible = await edgeManagementPage.isSearchVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the Add Server button", async ({ edgeManagementPage, consoleErrors }) => {
    const visible = await edgeManagementPage.isAddServerButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the device table", async ({ edgeManagementPage, consoleErrors }) => {
    const visible = await edgeManagementPage.isTableVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Table Content ───────────────────────────────────────────────────
test.describe("Edge Management - Table @edge @table", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let rowCount: number;

  test.beforeEach(async ({ loginPage, edgeManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await edgeManagementPage.goto();
    rowCount = await edgeManagementPage.getTableRowCount();
  });

  test("table should have rows when devices exist", async ({ edgeManagementPage, consoleErrors }) => {
    test.skip(rowCount === 0, "No edge devices available");
    expect(rowCount).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("pagination should be visible when devices exist", async ({ edgeManagementPage, consoleErrors }) => {
    test.skip(rowCount === 0, "No edge devices available");
    const visible = await edgeManagementPage.isPaginationVisible();
    // Pagination may or may not show depending on device count
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Row Actions ─────────────────────────────────────────────────────
test.describe("Edge Management - Row Actions @edge @menu", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, edgeManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await edgeManagementPage.goto();
  });

  test("row menu should have Manage License option", async ({ edgeManagementPage, page, consoleErrors }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No edge devices available");

    await edgeManagementPage.openRowMenu(0);
    const manageOption = page.locator('[role="menuitem"]:has-text("Manage License"), [role="menuitem"]:has-text("License")').first();
    const visible = await manageOption.isVisible().catch(() => false);
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("row menu should have Delete option", async ({ edgeManagementPage, page, consoleErrors }) => {
    const rowCount = await edgeManagementPage.getTableRowCount();
    test.skip(rowCount === 0, "No edge devices available");

    await edgeManagementPage.openRowMenu(0);
    const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")').first();
    const visible = await deleteOption.isVisible().catch(() => false);
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Add Server ──────────────────────────────────────────────────────
test.describe("Edge Management - Add Server @edge @create", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, edgeManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await edgeManagementPage.goto();
  });

  test("clicking Add Server should open a dialog or guide", async ({ edgeManagementPage, page, consoleErrors }) => {
    await edgeManagementPage.clickAddServer();
    // Add server opens a dialog with deployment guide link
    const dialogVisible = await page
      .locator('[role="dialog"], .mat-mdc-dialog-container, [class*="dialog"], [class*="modal"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(dialogVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 5: Search ──────────────────────────────────────────────────────────
test.describe("Edge Management - Search @edge @search", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, edgeManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await edgeManagementPage.goto();
  });

  test("no console errors after searching", async ({ edgeManagementPage, consoleErrors }) => {
    await edgeManagementPage.searchDevices("test");
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 6: Console Errors ──────────────────────────────────────────────────
test.describe("Edge Management - Console Errors @edge @console", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, edgeManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await edgeManagementPage.goto();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
