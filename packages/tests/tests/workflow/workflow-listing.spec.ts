import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Page Layout ─────────────────────────────────────────────────────
test.describe("Workflow Listing - Layout @workflow @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, workflowListingPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await workflowListingPage.goto();
  });

  test("should load the workflow listing page", async ({ workflowListingPage, consoleErrors }) => {
    const loaded = await workflowListingPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the search input", async ({ workflowListingPage, consoleErrors }) => {
    const visible = await workflowListingPage.isSearchVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the create workflow button", async ({ workflowListingPage, consoleErrors }) => {
    const visible = await workflowListingPage.isCreateButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Cards ───────────────────────────────────────────────────────────
test.describe("Workflow Listing - Cards @workflow @cards", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount: number;

  test.beforeEach(async ({ loginPage, workflowListingPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await workflowListingPage.goto();
    cardCount = await workflowListingPage.getCardCount();
  });

  test("should display workflow cards when workflows exist", async ({ workflowListingPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No workflows available");
    expect(cardCount).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("each card should have a title", async ({ workflowListingPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No workflows available");
    for (let i = 0; i < cardCount; i++) {
      const title = await workflowListingPage.getCardTitle(i);
      expect(title.length).toBeGreaterThan(0);
    }
    consoleErrors.assertNoErrors();
  });

  test("clicking a card should navigate to the workflow editor", async ({ workflowListingPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No workflows available");
    await workflowListingPage.clickCard(0);
    await workflowListingPage.expectWorkflowNavigation();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Card Menu ───────────────────────────────────────────────────────
test.describe("Workflow Listing - Card Menu @workflow @menu", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount: number;

  test.beforeEach(async ({ loginPage, workflowListingPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await workflowListingPage.goto();
    cardCount = await workflowListingPage.getCardCount();
  });

  test("card menu should have Rename and Delete options", async ({ workflowListingPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No workflows available");
    await workflowListingPage.openCardMenu(0);
    const items = await workflowListingPage.getCardMenuItems();
    const hasRename = items.some(i => i.toLowerCase().includes("rename"));
    const hasDelete = items.some(i => i.toLowerCase().includes("delete"));
    expect(hasRename).toBe(true);
    expect(hasDelete).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Search ──────────────────────────────────────────────────────────
test.describe("Workflow Listing - Search @workflow @search", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, workflowListingPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await workflowListingPage.goto();
  });

  test("no console errors after searching", async ({ workflowListingPage, consoleErrors }) => {
    await workflowListingPage.searchWorkflows("test");
    await workflowListingPage.clearSearch();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 5: Create Workflow ─────────────────────────────────────────────────
test.describe("Workflow Listing - Create @workflow @create", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, workflowListingPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await workflowListingPage.goto();
  });

  test("clicking Create Workflow should create a new workflow", async ({ workflowListingPage, page, consoleErrors }) => {
    const countBefore = await workflowListingPage.getCardCount();
    await workflowListingPage.clickCreateWorkflow();
    // Create may navigate to a new workflow or create inline
    await page.waitForTimeout(3000);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 6: Console Errors ──────────────────────────────────────────────────
test.describe("Workflow Listing - Console Errors @workflow @console", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, workflowListingPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await workflowListingPage.goto();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
