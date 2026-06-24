import { test as base } from "@playwright/test";
import { LoginPage, DashboardPage, NavigationPage, HomePage } from "../pages";
import { takeResultScreenshot } from "./screenshot-helper";
import { listenForConsoleErrors } from "../helpers/console-error-helper";

/**
 * Custom fixtures that inject Page Objects into every test.
 * Usage: `test('my test', async ({ loginPage, dashboardPage }) => { ... })`
 */
export type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  navigationPage: NavigationPage;
  homePage: HomePage;
  consoleErrors: ReturnType<typeof listenForConsoleErrors>;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  consoleErrors: async ({ page }, use) => {
    const capture = listenForConsoleErrors(page);
    await use(capture);
  },

  // Auto-fixture: takes a screenshot after every test with readable naming
  page: async ({ page }, use, testInfo) => {
    await use(page);
    await takeResultScreenshot(page, testInfo);
  },
});

export { expect } from "@playwright/test";
