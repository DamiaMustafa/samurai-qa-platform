import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import { NavigationPage } from "../../src/pages";

// ─── Block 1: Sidebar Navigation ─────────────────────────────────────────────
test.describe("Sidebar Navigation @home @navigation @sidebar", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, navigationPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    // Start from home page before each nav test
    await navigationPage.goToHome();
  });

  test("sidebar should be visible", async ({ navigationPage }) => {
    const visible = await navigationPage.isSidebarVisible();
    expect(visible).toBe(true);
  });

  test("sidebar should contain all expected nav items", async ({
    navigationPage,
  }) => {
    const links = await navigationPage.getNavLinks();
    const linksLower = links.map((l) => l.toLowerCase());

    const expectedItems = [
      "home",
      "projects",
      "instant distill",
      "edge",
      "workflow",
      "plan",
      "manage users",
      "logout",
    ];

    for (const item of expectedItems) {
      const found = linksLower.some((link) => link.includes(item));
      expect(found).toBe(true);
    }
  });

  test('clicking "Home" navigates to the home route', async ({
    navigationPage,
    page,
    consoleErrors,
  }) => {
    await navigationPage.goToHome();

    const url = page.url();
    const expectedPattern = NavigationPage.NAV_ROUTES.home;
    expect(url).toMatch(expectedPattern);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Projects" navigates to /projects', async ({
    navigationPage,
    page,
    consoleErrors,
  }) => {
    await navigationPage.goToProjects();

    const url = page.url();
    expect(url).toMatch(NavigationPage.NAV_ROUTES.projects);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Instant Distill" navigates to its route', async ({
    navigationPage,
    page,
    consoleErrors,
  }) => {
    await navigationPage.goToInstantDistill();

    const url = page.url();
    expect(url).toMatch(NavigationPage.NAV_ROUTES["instant distill"]);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Edge" navigates to /edge', async ({
    navigationPage,
    page,
    consoleErrors,
  }) => {
    await navigationPage.goToEdge();

    const url = page.url();
    expect(url).toMatch(NavigationPage.NAV_ROUTES.edge);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Workflow" navigates to /workflow', async ({
    navigationPage,
    page,
    consoleErrors,
  }) => {
    await navigationPage.goToWorkflow();

    const url = page.url();
    expect(url).toMatch(NavigationPage.NAV_ROUTES.workflow);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Plan" navigates to /plan', async ({
    navigationPage,
    page,
    consoleErrors,
  }) => {
    await navigationPage.goToPlan();

    const url = page.url();
    expect(url).toMatch(NavigationPage.NAV_ROUTES.plan);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Manage Users" navigates to its route', async ({
    navigationPage,
    page,
    consoleErrors,
  }) => {
    await navigationPage.goToManageUsers();

    const url = page.url();
    expect(url).toMatch(NavigationPage.NAV_ROUTES["manage users"]);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Logout" in sidebar logs out and redirects to login', async ({
    navigationPage,
    page,
    consoleErrors,
  }) => {
    await navigationPage.logout();

    await expect(page).toHaveURL(/sign-in|login|signin/, { timeout: 15000 });
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Top-Right User Dropdown Navigation ─────────────────────────────
test.describe("Top-Right Dropdown Navigation @home @navigation @menu", () => {
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

  test("clicking avatar/chevron opens the dropdown", async ({
    homePage,
    consoleErrors,
  }) => {
    await homePage.openUserMenu();
    expect(await homePage.isUserMenuOpen()).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("dropdown shows API Key, Profile, and Logout", async ({
    homePage,
    consoleErrors,
  }) => {
    await homePage.openUserMenu();
    const items = await homePage.getUserMenuItems();
    const itemsLower = items.map((i) => i.toLowerCase());

    expect(itemsLower.some((i) => i.includes("api key"))).toBe(true);
    expect(itemsLower.some((i) => i.includes("profile"))).toBe(true);
    expect(itemsLower.some((i) => i.includes("logout"))).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test('clicking "API Key" navigates to the correct route', async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    const urlBefore = page.url();
    await homePage.openUserMenu();
    await homePage.clickUserMenuItem("API Key");

    // Either a dialog opens or URL changes
    await page.waitForTimeout(2000);
    const dialogVisible = await page
      .locator(
        '[role="dialog"], .mat-mdc-dialog-container, [class*="modal"], [class*="api-key"], [class*="apikey"]'
      )
      .first()
      .isVisible()
      .catch(() => false);

    const urlAfter = page.url();
    const navigated = urlAfter !== urlBefore;

    expect(dialogVisible || navigated).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Profile" navigates to profile page', async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    const urlBefore = page.url();
    await homePage.openUserMenu();
    await homePage.clickUserMenuItem("Profile");

    await page.waitForTimeout(2000);

    // Profile may open a dialog or navigate to a new route
    const dialogVisible = await page
      .locator(
        '[role="dialog"], .mat-mdc-dialog-container, [class*="modal"], [class*="profile"]'
      )
      .first()
      .isVisible()
      .catch(() => false);

    const urlAfter = page.url();
    const navigated = urlAfter !== urlBefore;

    expect(dialogVisible || navigated).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test('clicking "Logout" in dropdown logs out and redirects to login', async ({
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

// ─── Block 3: Active State ────────────────────────────────────────────────────
test.describe("Sidebar Active State @home @navigation @active", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, navigationPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await navigationPage.goToHome();
  });

  test("Home nav item should be active on the home page", async ({
    navigationPage,
  }) => {
    const activeText = await navigationPage.getActiveNavLinkText();
    expect(activeText.toLowerCase()).toContain("home");
  });

  test("navigating to Projects updates the active nav item", async ({
    navigationPage,
    consoleErrors,
  }) => {
    await navigationPage.goToProjects();

    const isActive = await navigationPage.isNavLinkActive("projects");
    expect(isActive).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("navigating to Workflow updates the active nav item", async ({
    navigationPage,
    consoleErrors,
  }) => {
    await navigationPage.goToWorkflow();

    const isActive = await navigationPage.isNavLinkActive("workflow");
    expect(isActive).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("navigating between pages updates active state correctly", async ({
    navigationPage,
    consoleErrors,
  }) => {
    // Navigate to Projects
    await navigationPage.goToProjects();
    let projectsActive = await navigationPage.isNavLinkActive("projects");
    expect(projectsActive).toBe(true);

    // Navigate to Edge
    await navigationPage.goToEdge();
    let edgeActive = await navigationPage.isNavLinkActive("edge");
    expect(edgeActive).toBe(true);

    // Navigate back to Home
    await navigationPage.goToHome();
    let homeActive = await navigationPage.isNavLinkActive("home");
    expect(homeActive).toBe(true);

    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Console Error Checks on All Interactions ───────────────────────
test.describe("Console Error Checks - All Interactions @home @console", () => {
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

  test("no console errors after opening and closing kebab menu", async ({
    homePage,
    consoleErrors,
  }) => {
    const hasProjects = await homePage.hasProjectCards();
    test.skip(!hasProjects, "No project cards to interact with");

    await homePage.openKebabMenu(0);
    expect(await homePage.isKebabMenuOpen()).toBe(true);

    await homePage.clickOutside();
    expect(await homePage.isKebabMenuOpen()).toBe(false);

    consoleErrors.assertNoErrors();
  });

  test("no console errors after opening and closing user menu", async ({
    homePage,
    consoleErrors,
  }) => {
    await homePage.openUserMenu();
    expect(await homePage.isUserMenuOpen()).toBe(true);

    await homePage.closeUserMenu();
    expect(await homePage.isUserMenuOpen()).toBe(false);

    consoleErrors.assertNoErrors();
  });

  test("no console errors after opening language dropdown", async ({
    homePage,
    consoleErrors,
  }) => {
    const visible = await homePage.isLanguageSelectorVisible();
    test.skip(!visible, "Language selector not visible");

    await homePage.openLanguageDropdown();
    const options = await homePage.getLanguageOptions();
    expect(options.length).toBeGreaterThan(0);

    consoleErrors.assertNoErrors();
  });

  test("no console errors after navigating through all sidebar links", async ({
    navigationPage,
    consoleErrors,
  }) => {
    const navActions = [
      () => navigationPage.goToProjects(),
      () => navigationPage.goToInstantDistill(),
      () => navigationPage.goToEdge(),
      () => navigationPage.goToWorkflow(),
      () => navigationPage.goToPlan(),
      () => navigationPage.goToManageUsers(),
      () => navigationPage.goToHome(),
    ];

    for (const action of navActions) {
      await action();
    }

    consoleErrors.assertNoErrors();
  });

  test("no console errors after clicking Open Project button", async ({
    homePage,
    page,
    consoleErrors,
  }) => {
    const hasProjects = await homePage.hasProjectCards();
    test.skip(!hasProjects, "No project cards to interact with");

    await homePage.clickOpenProjectPage(0);

    // Wait for navigation to complete
    await page.waitForLoadState("networkidle");

    consoleErrors.assertNoErrors();
  });

  test("no console errors after selecting a language", async ({
    homePage,
    consoleErrors,
  }) => {
    const visible = await homePage.isLanguageSelectorVisible();
    test.skip(!visible, "Language selector not visible");

    await homePage.openLanguageDropdown();
    const options = await homePage.getLanguageOptions();
    test.skip(options.length < 2, "Only one language available");

    const currentLang = await homePage.getCurrentLanguage();
    const otherLang = options.find(
      (opt) => opt.toLowerCase() !== currentLang.toLowerCase()
    );
    test.skip(!otherLang, "No different language to switch to");
    if (!otherLang) return;

    await homePage.selectLanguage(otherLang);

    consoleErrors.assertNoErrors();
  });
});
