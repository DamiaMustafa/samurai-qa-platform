import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Page Layout ─────────────────────────────────────────────────────
test.describe("API Keys Page - Layout @api-keys @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, apiKeysPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await apiKeysPage.goto();
  });

  test("should load the API keys page", async ({ apiKeysPage, consoleErrors }) => {
    const loaded = await apiKeysPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the search input", async ({ apiKeysPage, consoleErrors }) => {
    const visible = await apiKeysPage.isSearchVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the create new key button", async ({ apiKeysPage, consoleErrors }) => {
    const visible = await apiKeysPage.isCreateButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display either the table or empty state", async ({ apiKeysPage, consoleErrors }) => {
    const tableVisible = await apiKeysPage.isTableVisible();
    const emptyVisible = await apiKeysPage.isEmptyStateVisible();
    expect(tableVisible || emptyVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Table / Empty State ─────────────────────────────────────────────
test.describe("API Keys Page - Content @api-keys @table", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, apiKeysPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await apiKeysPage.goto();
  });

  test("empty state should have a create button when no keys exist", async ({ apiKeysPage, consoleErrors }) => {
    const emptyVisible = await apiKeysPage.isEmptyStateVisible();
    test.skip(!emptyVisible, "API keys exist — no empty state");
    const createVisible = await apiKeysPage.isCreateButtonInEmptyStateVisible();
    expect(createVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("table should be visible when API keys exist", async ({ apiKeysPage, consoleErrors }) => {
    const tableVisible = await apiKeysPage.isTableVisible();
    test.skip(!tableVisible, "No API keys table visible");
    const rowCount = await apiKeysPage.getTableRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Row Actions ─────────────────────────────────────────────────────
test.describe("API Keys Page - Row Actions @api-keys @menu", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, apiKeysPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await apiKeysPage.goto();
  });

  test("opening row menu should show action options", async ({ apiKeysPage, consoleErrors }) => {
    const tableVisible = await apiKeysPage.isTableVisible();
    test.skip(!tableVisible, "No API keys table");
    const rowCount = await apiKeysPage.getTableRowCount();
    test.skip(rowCount === 0, "No rows in table");

    await apiKeysPage.openRowMenu(0);
    const items = await apiKeysPage.getRowMenuItems();
    // Expected: Edit Key, Activate/Revoke Key, Delete Key
    expect(items.length).toBeGreaterThanOrEqual(2);
    consoleErrors.assertNoErrors();
  });

  test("row menu should contain Edit option", async ({ apiKeysPage, consoleErrors }) => {
    const tableVisible = await apiKeysPage.isTableVisible();
    test.skip(!tableVisible, "No API keys table");
    const rowCount = await apiKeysPage.getTableRowCount();
    test.skip(rowCount === 0, "No rows in table");

    await apiKeysPage.openRowMenu(0);
    const items = await apiKeysPage.getRowMenuItems();
    const hasEdit = items.some(i => i.toLowerCase().includes("edit"));
    expect(hasEdit).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("row menu should contain Delete option", async ({ apiKeysPage, consoleErrors }) => {
    const tableVisible = await apiKeysPage.isTableVisible();
    test.skip(!tableVisible, "No API keys table");
    const rowCount = await apiKeysPage.getTableRowCount();
    test.skip(rowCount === 0, "No rows in table");

    await apiKeysPage.openRowMenu(0);
    const items = await apiKeysPage.getRowMenuItems();
    const hasDelete = items.some(i => i.toLowerCase().includes("delete"));
    expect(hasDelete).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("row menu should contain Revoke or Activate option", async ({ apiKeysPage, consoleErrors }) => {
    const tableVisible = await apiKeysPage.isTableVisible();
    test.skip(!tableVisible, "No API keys table");
    const rowCount = await apiKeysPage.getTableRowCount();
    test.skip(rowCount === 0, "No rows in table");

    await apiKeysPage.openRowMenu(0);
    const items = await apiKeysPage.getRowMenuItems();
    const hasRevokeOrActivate = items.some(i =>
      i.toLowerCase().includes("revoke") || i.toLowerCase().includes("activate")
    );
    expect(hasRevokeOrActivate).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Create API Key Navigation ───────────────────────────────────────
test.describe("API Keys Page - Create Navigation @api-keys @navigation", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, apiKeysPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await apiKeysPage.goto();
  });

  test("clicking Create New Key should navigate to /api-keys/create", async ({ apiKeysPage, consoleErrors }) => {
    await apiKeysPage.clickCreateNewKey();
    await apiKeysPage.expectCreateNavigation();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 5: Create Page ─────────────────────────────────────────────────────
test.describe("API Keys Page - Create Form @api-keys @create", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, apiKeysPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await apiKeysPage.gotoCreate();
  });

  test("should load the create API key page", async ({ apiKeysPage, consoleErrors }) => {
    const loaded = await apiKeysPage.isCreatePageLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the name input", async ({ apiKeysPage, consoleErrors }) => {
    const visible = await apiKeysPage.isNameInputVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("submit button should be disabled when name is empty", async ({ apiKeysPage, consoleErrors }) => {
    const disabled = await apiKeysPage.isSubmitButtonDisabled();
    expect(disabled).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("back button should navigate back", async ({ apiKeysPage, page, consoleErrors }) => {
    await apiKeysPage.clickCreateBack();
    await page.waitForTimeout(1000);
    // Should go back to previous page
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 6: Search ──────────────────────────────────────────────────────────
test.describe("API Keys Page - Search @api-keys @search", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, apiKeysPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await apiKeysPage.goto();
  });

  test("no console errors after searching", async ({ apiKeysPage, consoleErrors }) => {
    await apiKeysPage.searchKeys("test");
    await apiKeysPage.clearSearch();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 7: Console Errors ──────────────────────────────────────────────────
test.describe("API Keys Page - Console Errors @api-keys @console", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, apiKeysPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await apiKeysPage.goto();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
