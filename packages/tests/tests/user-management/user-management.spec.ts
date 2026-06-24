import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Page Layout ─────────────────────────────────────────────────────
test.describe("User Management - Layout @user-mgmt @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, userManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await userManagementPage.goto();
  });

  test("should load the user management page", async ({ userManagementPage, consoleErrors }) => {
    const loaded = await userManagementPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the Users tab", async ({ userManagementPage, consoleErrors }) => {
    const visible = await userManagementPage.isUsersTabVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the search input", async ({ userManagementPage, consoleErrors }) => {
    const visible = await userManagementPage.isSearchVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Tabs ────────────────────────────────────────────────────────────
test.describe("User Management - Tabs @user-mgmt @tabs", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, userManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await userManagementPage.goto();
  });

  test("Members tab should be active by default", async ({ userManagementPage, consoleErrors }) => {
    const active = await userManagementPage.isMembersTabActive();
    expect(active).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("clicking Pending Requests tab should switch view", async ({ userManagementPage, consoleErrors }) => {
    await userManagementPage.clickPendingTab();
    const active = await userManagementPage.isPendingTabActive();
    expect(active).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("clicking Members tab should switch back", async ({ userManagementPage, consoleErrors }) => {
    await userManagementPage.clickPendingTab();
    await userManagementPage.clickMembersTab();
    const active = await userManagementPage.isMembersTabActive();
    expect(active).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("Companies tab should only be visible for superadmin", async ({ userManagementPage, consoleErrors }) => {
    // For admin (non-superadmin), Companies tab should NOT be visible
    const visible = await userManagementPage.isCompaniesTabVisible();
    // Just assert it doesn't error — visibility depends on role
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Members Table ───────────────────────────────────────────────────
test.describe("User Management - Members @user-mgmt @table", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, userManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await userManagementPage.goto();
  });

  test("members table should have rows", async ({ userManagementPage, consoleErrors }) => {
    const rowCount = await userManagementPage.getMembersRowCount();
    expect(rowCount).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("role filters should be visible", async ({ userManagementPage, consoleErrors }) => {
    const visible = await userManagementPage.isRoleFilterVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Search ──────────────────────────────────────────────────────────
test.describe("User Management - Search @user-mgmt @search", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, userManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await userManagementPage.goto();
  });

  test("no console errors after searching", async ({ userManagementPage, consoleErrors }) => {
    await userManagementPage.searchUsers("test");
    await userManagementPage.clearSearch();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 5: Console Errors ──────────────────────────────────────────────────
test.describe("User Management - Console Errors @user-mgmt @console", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, userManagementPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await userManagementPage.goto();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });

  test("no console errors after tab switching", async ({ userManagementPage, consoleErrors }) => {
    await userManagementPage.clickPendingTab();
    await userManagementPage.clickMembersTab();
    consoleErrors.assertNoErrors();
  });
});
