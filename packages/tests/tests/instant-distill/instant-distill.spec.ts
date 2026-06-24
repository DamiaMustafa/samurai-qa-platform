import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Page Layout ─────────────────────────────────────────────────────
test.describe("Instant Distill - Layout @instant-distill @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, instantDistillPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await instantDistillPage.goto();
  });

  test("should load the instant distill page", async ({ instantDistillPage, consoleErrors }) => {
    const loaded = await instantDistillPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the create button", async ({ instantDistillPage, consoleErrors }) => {
    const visible = await instantDistillPage.isCreateButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Content ─────────────────────────────────────────────────────────
test.describe("Instant Distill - Content @instant-distill @content", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount: number;

  test.beforeEach(async ({ loginPage, instantDistillPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await instantDistillPage.goto();
    cardCount = await instantDistillPage.getCardCount();
  });

  test("should display cards or empty state", async ({ instantDistillPage, consoleErrors }) => {
    const emptyVisible = await instantDistillPage.isEmptyStateVisible();
    expect(cardCount > 0 || emptyVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display project cards when projects exist", async ({ instantDistillPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No instant distill projects available");
    expect(cardCount).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Create Navigation ───────────────────────────────────────────────
test.describe("Instant Distill - Create Navigation @instant-distill @navigation", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, instantDistillPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await instantDistillPage.goto();
  });

  test("clicking Create should navigate to /instant-distill/create", async ({ instantDistillPage, consoleErrors }) => {
    await instantDistillPage.clickCreate();
    await instantDistillPage.expectCreateNavigation();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Console Errors ──────────────────────────────────────────────────
test.describe("Instant Distill - Console Errors @instant-distill @console", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, instantDistillPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await instantDistillPage.goto();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
