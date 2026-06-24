import { test as base } from "@playwright/test";
import { LoginPage, DashboardPage, NavigationPage, HomePage } from "../pages";
import { type PageFixtures } from "./base-fixture";
import { takeResultScreenshot } from "./screenshot-helper";
import { listenForConsoleErrors } from "../helpers/console-error-helper";

/**
 * Auth fixture — provides a pre-authenticated session.
 * Tests using `authTest` will be logged in as admin before running.
 * Uses storageState for session reuse across tests in the same worker.
 */

type AuthFixtures = PageFixtures & {
  authenticatedPage: {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    navigationPage: NavigationPage;
    homePage: HomePage;
  };
};

export const authTest = base.extend<AuthFixtures>({
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

  authenticatedPage: async ({ page, loginPage, dashboardPage, navigationPage, homePage }, use) => {
    // Login before providing the fixture
    await loginPage.loginAs("admin");
    await use({ loginPage, dashboardPage, navigationPage, homePage });
  },
});

export { expect } from "@playwright/test";
