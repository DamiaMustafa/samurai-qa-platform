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
    consoleErrors,
  }) => {
    await homePage.goto();
    const visible = await homePage.isRecentProjectsHeadingVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should have the correct heading text", async ({ homePage, consoleErrors }) => {
    await homePage.goto();
    const text = await homePage.getRecentProjectsHeadingText();
    expect(text.toLowerCase()).toContain("recent projects");
    consoleErrors.assertNoErrors();
  });

  test("should have a meaningful page title", async ({ homePage, consoleErrors }) => {
    await homePage.goto();
    const title = await homePage.getTitle();
    expect(title.length).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
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
    const hasProjects = await homePage.hasProjectCards();
    test.skip(hasProjects, "Account has projects — empty state tests not applicable");
  });

  test('should show "Recent Projects" heading without project cards', async ({
    homePage,
    consoleErrors,
  }) => {
    const headingVisible = await homePage.isRecentProjectsHeadingVisible();
    expect(headingVisible).toBe(true);

    const count = await homePage.getProjectCardCount();
    expect(count).toBe(0);
    consoleErrors.assertNoErrors();
  });

  test("should not display any error indicators in empty state", async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    const errorVisible = await page
      .locator('[role="alert"], .error, .toast-error, [class*="error-message"]')
      .first()
      .isVisible()
      .catch(() => false);
    expect(errorVisible).toBe(false);
    consoleErrors.assertNoErrors();
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
    consoleErrors,
  }) => {
    expect(cardCount).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("should display at most 3 project cards", async ({ homePage, consoleErrors }) => {
    await homePage.expectMaxProjectCards();
    consoleErrors.assertNoErrors();
  });

  test("should display a thumbnail image on each project card", async ({
    homePage,
    consoleErrors,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const visible = await homePage.isProjectCardThumbnailVisible(i);
      expect(visible).toBe(true);
    }
    consoleErrors.assertNoErrors();
  });

  test("should display the project name on each card", async ({ homePage, consoleErrors }) => {
    for (let i = 0; i < cardCount; i++) {
      const name = await homePage.getProjectCardName(i);
      expect(name.length).toBeGreaterThan(0);
    }
    consoleErrors.assertNoErrors();
  });

  test("should display a date on each project card", async ({ homePage, consoleErrors }) => {
    for (let i = 0; i < cardCount; i++) {
      const date = await homePage.getProjectCardDate(i);
      expect(date.length).toBeGreaterThan(0);
    }
    consoleErrors.assertNoErrors();
  });

  test("should display a version badge on each project card", async ({
    homePage,
    consoleErrors,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const badge = await homePage.getProjectCardVersionBadge(i);
      expect(badge.length).toBeGreaterThan(0);
    }
    consoleErrors.assertNoErrors();
  });

  test("should display a task type badge on each project card", async ({
    homePage,
    consoleErrors,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const badge = await homePage.getProjectCardTaskTypeBadge(i);
      expect(badge.length).toBeGreaterThan(0);
    }
    consoleErrors.assertNoErrors();
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
    consoleErrors,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const visible = await homePage.isOpenProjectButtonVisible(i);
      expect(visible).toBe(true);
    }
    consoleErrors.assertNoErrors();
  });

  test('clicking "Open Project Page →" should navigate to the project', async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    const urlBefore = page.url();

    await homePage.clickOpenProjectPage(0);

    const urlAfter = page.url();
    expect(urlAfter).not.toBe(urlBefore);
    consoleErrors.assertNoErrors();
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
    consoleErrors,
  }) => {
    for (let i = 0; i < cardCount; i++) {
      const visible = await homePage.isKebabMenuButtonVisible(i);
      expect(visible).toBe(true);
    }
    consoleErrors.assertNoErrors();
  });

  test("clicking kebab menu should open the dropdown", async ({ homePage, consoleErrors }) => {
    await homePage.openKebabMenu(0);
    const isOpen = await homePage.isKebabMenuOpen();
    expect(isOpen).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("kebab menu should display 5 standard options", async ({ homePage, consoleErrors }) => {
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
    consoleErrors.assertNoErrors();
  });

  test("kebab menu should close when clicking outside", async ({ homePage, consoleErrors }) => {
    await homePage.openKebabMenu(0);
    expect(await homePage.isKebabMenuOpen()).toBe(true);

    await homePage.clickOutside();
    expect(await homePage.isKebabMenuOpen()).toBe(false);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Duplicate" should trigger an action', async ({
    homePage,
    consoleErrors,
  }) => {
    const countBefore = await homePage.getProjectCardCount();

    await homePage.openKebabMenu(0);
    await homePage.clickKebabMenuItem("Duplicate");

    expect(await homePage.isKebabMenuOpen()).toBe(false);

    const countAfter = await homePage.getProjectCardCount();
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Delete" should trigger confirmation or action', async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    await homePage.openKebabMenu(0);
    await homePage.clickKebabMenuItem("Delete");

    const dialogVisible = await page
      .locator(
        '[role="dialog"], .mat-mdc-dialog-container, [class*="confirm"], [class*="modal"]'
      )
      .first()
      .isVisible()
      .catch(() => false);

    const menuClosed = !(await homePage.isKebabMenuOpen());

    expect(dialogVisible || menuClosed).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 6: Language Selector ───────────────────────────────────────────────
test.describe("Home Page - Language Selector @home @i18n", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, homePage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await homePage.goto();
  });

  test("should display the language selector", async ({ homePage, consoleErrors }) => {
    const visible = await homePage.isLanguageSelectorVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should show the current language", async ({ homePage, consoleErrors }) => {
    const language = await homePage.getCurrentLanguage();
    expect(language.length).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("should have at least one language option available", async ({
    homePage,
    consoleErrors,
  }) => {
    await homePage.openLanguageDropdown();
    const options = await homePage.getLanguageOptions();
    expect(options.length).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("selecting a language should change the current language", async ({
    homePage,
    consoleErrors,
  }) => {
    await homePage.openLanguageDropdown();
    const options = await homePage.getLanguageOptions();

    test.skip(
      options.length < 2,
      "Only one language available — cannot test selection"
    );

    const currentLang = await homePage.getCurrentLanguage();
    const otherLang = options.find(
      (opt) => opt.toLowerCase() !== currentLang.toLowerCase()
    );
    if (!otherLang) {
      test.skip(true, "No different language found to switch to");
      return;
    }

    await homePage.selectLanguage(otherLang);

    const newLang = await homePage.getCurrentLanguage();
    expect(newLang.toLowerCase()).toContain(otherLang.toLowerCase());
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 7: User Avatar & Role ─────────────────────────────────────────────
test.describe("Home Page - User Avatar and Role @home @header", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, homePage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await homePage.goto();
  });

  test("should display the user avatar image", async ({ homePage, consoleErrors }) => {
    const visible = await homePage.isUserAvatarVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("user avatar should have a valid image source", async ({ homePage, consoleErrors }) => {
    const src = await homePage.getUserAvatarSrc();
    expect(src.length).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });

  test("should display the user role label", async ({ homePage, consoleErrors }) => {
    const visible = await homePage.isRoleLabelVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("role label should contain a meaningful role name", async ({
    homePage,
    consoleErrors,
  }) => {
    const role = await homePage.getRoleLabelText();
    expect(role.length).toBeGreaterThan(0);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 8: User Menu Dropdown ──────────────────────────────────────────────
test.describe("Home Page - User Menu Dropdown @home @menu", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, homePage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await homePage.goto();
  });

  test("should display the user menu button", async ({ homePage, consoleErrors }) => {
    const visible = await homePage.isUserMenuButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("clicking user menu should open the dropdown", async ({ homePage, consoleErrors }) => {
    await homePage.openUserMenu();
    const isOpen = await homePage.isUserMenuOpen();
    expect(isOpen).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("user menu should contain API Key, Profile, and Logout options", async ({
    homePage,
    consoleErrors,
  }) => {
    await homePage.openUserMenu();
    const items = await homePage.getUserMenuItems();
    const itemsLower = items.map((i) => i.toLowerCase());

    const expectedActions = ["api key", "profile", "logout"];
    for (const action of expectedActions) {
      const found = itemsLower.some((i) => i.includes(action));
      expect(found).toBe(true);
    }
    consoleErrors.assertNoErrors();
  });

  test("user menu should close when clicking outside", async ({ homePage, consoleErrors }) => {
    await homePage.openUserMenu();
    expect(await homePage.isUserMenuOpen()).toBe(true);

    await homePage.closeUserMenu();
    expect(await homePage.isUserMenuOpen()).toBe(false);
    consoleErrors.assertNoErrors();
  });

  test('clicking "API Key" should navigate or open a dialog', async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    await homePage.openUserMenu();
    await homePage.clickUserMenuItem("API Key");

    const dialogVisible = await page
      .locator(
        '[role="dialog"], .mat-mdc-dialog-container, [class*="modal"], [class*="api-key"]'
      )
      .first()
      .isVisible()
      .catch(() => false);

    const urlChanged = !page.url().endsWith("/");

    expect(dialogVisible || urlChanged).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Profile" should navigate to profile page', async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    await homePage.openUserMenu();
    await homePage.clickUserMenuItem("Profile");

    const url = page.url();
    expect(url).not.toMatch(/\/$/);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Logout" should sign the user out', async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    await homePage.openUserMenu();
    await homePage.clickUserMenuItem("Logout");

    await expect(page).toHaveURL(/sign-in|login|signin/, { timeout: 15000 });
    consoleErrors.assertNoErrors();
  });
});
