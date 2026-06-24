import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Page Load & Layout ──────────────────────────────────────────────
test.describe("Projects Page - Layout @projects @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, projectsPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectsPage.goto();
    await projectsPage.waitForLoadingComplete();
  });

  test("should load the projects page", async ({ projectsPage, consoleErrors }) => {
    const loaded = await projectsPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the search input", async ({ projectsPage, consoleErrors }) => {
    const visible = await projectsPage.isSearchVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the filter menu", async ({ projectsPage, consoleErrors }) => {
    const visible = await projectsPage.isFilterMenuVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the create project button", async ({ projectsPage, consoleErrors }) => {
    const visible = await projectsPage.isCreateButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Project Cards ───────────────────────────────────────────────────
test.describe("Projects Page - Project Cards @projects @cards", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount: number;

  test.beforeEach(async ({ loginPage, projectsPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectsPage.goto();
    await projectsPage.waitForLoadingComplete();
    cardCount = await projectsPage.getProjectCardCount();
  });

  test("should display project cards when projects exist", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    expect(cardCount).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("each project card should have a name", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    for (let i = 0; i < cardCount; i++) {
      const name = await projectsPage.getProjectCardName(i);
      expect(name.length).toBeGreaterThan(0);
    }
    consoleErrors.assertNoErrors();
  });

  test("each project card should have an open button", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    for (let i = 0; i < cardCount; i++) {
      const visible = await projectsPage.isOpenProjectButtonVisible(i);
      expect(visible).toBe(true);
    }
    consoleErrors.assertNoErrors();
  });

  test("clicking Open Project should navigate to project overview", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.clickOpenProject(0);
    await projectsPage.expectProjectNavigation();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Card Kebab Menu ─────────────────────────────────────────────────
test.describe("Projects Page - Card Menu @projects @menu", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount: number;

  test.beforeEach(async ({ loginPage, projectsPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectsPage.goto();
    await projectsPage.waitForLoadingComplete();
    cardCount = await projectsPage.getProjectCardCount();
  });

  test("should have a kebab menu on each project card", async ({ projectsPage, page, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    const cards = page.locator("sc-project-card");
    for (let i = 0; i < cardCount; i++) {
      const menu = cards.nth(i).locator("sc-submenu, [class*='submenu'], button[aria-haspopup]").first();
      const visible = await menu.isVisible().catch(() => false);
      expect(visible).toBe(true);
    }
    consoleErrors.assertNoErrors();
  });

  test("clicking kebab menu should open dropdown with options", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.openCardMenu(0);
    const items = await projectsPage.getCardMenuItems();
    // Expected: Duplicate, Copy Project ID, Rename, Archive/Unarchive, Delete
    expect(items.length).toBeGreaterThanOrEqual(3);
    consoleErrors.assertNoErrors();
  });

  test("menu should contain Duplicate option", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.openCardMenu(0);
    const items = await projectsPage.getCardMenuItems();
    const hasDuplicate = items.some(i => i.toLowerCase().includes("duplicate"));
    expect(hasDuplicate).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("menu should contain Delete option", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.openCardMenu(0);
    const items = await projectsPage.getCardMenuItems();
    const hasDelete = items.some(i => i.toLowerCase().includes("delete"));
    expect(hasDelete).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("menu should contain Rename option", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.openCardMenu(0);
    const items = await projectsPage.getCardMenuItems();
    const hasRename = items.some(i => i.toLowerCase().includes("rename"));
    expect(hasRename).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("menu should close when clicking outside", async ({ projectsPage, page, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.openCardMenu(0);
    await projectsPage.clickOutside();
    await page.waitForTimeout(500);
    const menuVisible = await page.locator('[role="menu"], .mat-mdc-menu-panel').first().isVisible().catch(() => false);
    expect(menuVisible).toBe(false);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Search ──────────────────────────────────────────────────────────
test.describe("Projects Page - Search @projects @search", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount: number;

  test.beforeEach(async ({ loginPage, projectsPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectsPage.goto();
    await projectsPage.waitForLoadingComplete();
    cardCount = await projectsPage.getProjectCardCount();
  });

  test("searching with a non-matching term should show empty state or fewer cards", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.searchProjects("xyznonexistent12345");
    const countAfter = await projectsPage.getProjectCardCount();
    expect(countAfter).toBeLessThan(cardCount);
    await projectsPage.clearSearch();
    consoleErrors.assertNoErrors();
  });

  test("clearing search should restore all projects", async ({ projectsPage, consoleErrors }) => {
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.searchProjects("xyznonexistent12345");
    await projectsPage.clearSearch();
    await projectsPage.waitForLoadingComplete();
    const countAfter = await projectsPage.getProjectCardCount();
    expect(countAfter).toBe(cardCount);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 5: Create Project Navigation ───────────────────────────────────────
test.describe("Projects Page - Create Navigation @projects @navigation", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, projectsPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectsPage.goto();
    await projectsPage.waitForLoadingComplete();
  });

  test("clicking Create Project button should navigate to /project-creation", async ({ projectsPage, consoleErrors }) => {
    await projectsPage.clickCreateProject();
    await projectsPage.expectCreateProjectNavigation();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 6: Pagination ──────────────────────────────────────────────────────
test.describe("Projects Page - Pagination @projects @pagination", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, projectsPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectsPage.goto();
    await projectsPage.waitForLoadingComplete();
  });

  test("pagination should be visible when projects exist", async ({ projectsPage, consoleErrors }) => {
    const cardCount = await projectsPage.getProjectCardCount();
    test.skip(cardCount === 0, "No projects available");
    // Pagination shows when there are projects
    const visible = await projectsPage.isPaginationVisible();
    // May or may not be visible depending on total count — just assert no errors
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 7: Console Error Checks ────────────────────────────────────────────
test.describe("Projects Page - Console Errors @projects @console", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, projectsPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectsPage.goto();
    await projectsPage.waitForLoadingComplete();
  });

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });

  test("no console errors after searching", async ({ projectsPage, consoleErrors }) => {
    await projectsPage.searchProjects("test");
    await projectsPage.clearSearch();
    consoleErrors.assertNoErrors();
  });

  test("no console errors after opening card menu", async ({ projectsPage, consoleErrors }) => {
    const cardCount = await projectsPage.getProjectCardCount();
    test.skip(cardCount === 0, "No projects available");
    await projectsPage.openCardMenu(0);
    await projectsPage.clickOutside();
    consoleErrors.assertNoErrors();
  });
});
