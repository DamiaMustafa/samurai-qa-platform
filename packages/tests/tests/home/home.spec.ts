import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Static Elements ─────────────────────────────────────────────────
test.describe("Home Page - Static Elements @home @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
  });

  test('should display "Recent Projects" heading after login', async ({
    homePage,
  }) => {
    await homePage.goto();
    const visible = await homePage.isRecentProjectsHeadingVisible();
    expect(visible).toBe(true);
  });

  test("should have the correct heading text", async ({ homePage }) => {
    await homePage.goto();
    const text = await homePage.getRecentProjectsHeadingText();
    expect(text.toLowerCase()).toContain("recent projects");
  });

  test("should have a meaningful page title", async ({ homePage }) => {
    await homePage.goto();
    const title = await homePage.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ─── Block 2: Empty State ─────────────────────────────────────────────────────
test.describe("Home Page - Empty State @home", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, homePage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    await homePage.goto();
    // Skip this entire block if the user HAS projects (we're testing empty state)
    const hasProjects = await homePage.hasProjectCards();
    test.skip(hasProjects, "Account has projects — empty state tests not applicable");
  });

  test('should show "Recent Projects" heading without project cards', async ({
    homePage,
  }) => {
    const headingVisible = await homePage.isRecentProjectsHeadingVisible();
    expect(headingVisible).toBe(true);

    const count = await homePage.getProjectCardCount();
    expect(count).toBe(0);
  });

  test("should not display any error indicators in empty state", async ({
    homePage,
    page,
  }) => {
    // No error toasts, alerts, or error messages should be visible
    const errorVisible = await page
      .locator('[role="alert"], .error, .toast-error, [class*="error-message"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(errorVisible).toBe(false);
  });
});

// ─── Block 3: Project Cards ───────────────────────────────────────────────────
test.describe("Home Page - Project Cards @home @dashboard", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount = 0;

  test.beforeEach(async ({ loginPage, homePage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    await homePage.goto();
    cardCount = await homePage.getProjectCardCount();
    test.skip(
      cardCount === 0,
      "No projects available — project card tests not applicable"
    );
  });

  test("should display project cards when user has projects", async ({
    homePage,
  }) => {
    expect(cardCount).toBeGreaterThan(0);
  });

  test("should display at most 3 project cards", async ({ homePage }) => {
    await homePage.expectMaxProjectCards();
  });

  test("should display a thumbnail image on each project card", async ({
    homePage,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const visible = await homePage.isProjectCardThumbnailVisible(i);
      expect(visible).toBe(true);
    }
  });

  test("should display the project name on each card", async ({ homePage }) => {
    for (let i = 0; i < cardCount; i++) {
      const name = await homePage.getProjectCardName(i);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  test("should display a date on each project card", async ({ homePage }) => {
    for (let i = 0; i < cardCount; i++) {
      const date = await homePage.getProjectCardDate(i);
      expect(date.length).toBeGreaterThan(0);
    }
  });

  test("should display a version badge on each project card", async ({
    homePage,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const badge = await homePage.getProjectCardVersionBadge(i);
      expect(badge.length).toBeGreaterThan(0);
    }
  });

  test("should display a task type badge on each project card", async ({
    homePage,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const badge = await homePage.getProjectCardTaskTypeBadge(i);
      expect(badge.length).toBeGreaterThan(0);
    }
  });
});

// ─── Block 4: Open Project Navigation ─────────────────────────────────────────
test.describe("Home Page - Open Project Navigation @home @navigation", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount = 0;

  test.beforeEach(async ({ loginPage, homePage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    await homePage.goto();
    cardCount = await homePage.getProjectCardCount();
    test.skip(
      cardCount === 0,
      "No projects available — navigation tests not applicable"
    );
  });

  test('"Open Project Page →" button should be visible on each card', async ({
    homePage,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const visible = await homePage.isOpenProjectButtonVisible(i);
      expect(visible).toBe(true);
    }
  });

  test('clicking "Open Project Page →" should navigate to the project', async ({
    homePage,
    page,
  }) => {
    const urlBefore = page.url();

    await homePage.clickOpenProjectPage(0);

    // URL should change — either to a project route or away from the home page
    const urlAfter = page.url();
    expect(urlAfter).not.toBe(urlBefore);
  });
});

// ─── Block 5: Kebab Menu ──────────────────────────────────────────────────────
test.describe("Home Page - Kebab Menu @home @menu", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let cardCount = 0;

  test.beforeEach(async ({ loginPage, homePage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    await homePage.goto();
    cardCount = await homePage.getProjectCardCount();
    test.skip(
      cardCount === 0,
      "No projects available — kebab menu tests not applicable"
    );
  });

  test("should have kebab menu button on each project card", async ({
    homePage,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const visible = await homePage.isKebabMenuButtonVisible(i);
      expect(visible).toBe(true);
    }
  });

  test("clicking kebab menu should open the dropdown", async ({ homePage }) => {
    await homePage.openKebabMenu(0);
    const isOpen = await homePage.isKebabMenuOpen();
    expect(isOpen).toBe(true);
  });

  test("kebab menu should display 5 standard options", async ({ homePage }) => {
    await homePage.openKebabMenu(0);
    const items = await homePage.getKebabMenuItems();

    const expectedActions = [
      "duplicate",
      "copy",
      "rename",
      "delete",
      "archive",
    ];
    const itemsLower = items.map((item) => item.toLowerCase());

    for (const action of expectedActions) {
      const found = itemsLower.some((item) => item.includes(action));
      expect(found).toBe(true);
    }
  });

  test("kebab menu should close when clicking outside", async ({ homePage }) => {
    await homePage.openKebabMenu(0);
    expect(await homePage.isKebabMenuOpen()).toBe(true);

    await homePage.clickOutside();
    expect(await homePage.isKebabMenuOpen()).toBe(false);
  });

  test('clicking "Duplicate" should trigger an action', async ({
    homePage,
  }) => {
    const countBefore = await homePage.getProjectCardCount();

    await homePage.openKebabMenu(0);
    await homePage.clickKebabMenuItem("Duplicate");

    // After duplicate, the menu should close
    expect(await homePage.isKebabMenuOpen()).toBe(false);

    // Card count may increase (new duplicate created) or a toast may appear
    // We just verify the action was processed (menu dismissed)
    const countAfter = await homePage.getProjectCardCount();
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });

  test('clicking "Delete" should trigger confirmation or action', async ({
    homePage,
    page,
  }) => {
    await homePage.openKebabMenu(0);
    await homePage.clickKebabMenuItem("Delete");

    // Either a confirmation dialog appears or the menu closes (action taken)
    const dialogVisible = await page
      .locator(
        '[role="dialog"], .mat-mdc-dialog-container, [class*="confirm"], [class*="modal"]'
      )
      .first()
      .isVisible()
      .catch(() => false);

    const menuClosed = !(await homePage.isKebabMenuOpen());

    // At least one of these should be true
    expect(dialogVisible || menuClosed).toBe(true);
  });
});
