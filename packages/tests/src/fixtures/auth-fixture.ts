import { test as base } from "@playwright/test";
import { LoginPage, DashboardPage, NavigationPage } from "../pages";
import { type PageFixtures } from "./base-fixture";

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

  authenticatedPage: async ({ page, loginPage, dashboardPage, navigationPage }, use) => {
    // Login before providing the fixture
    await loginPage.loginAs("admin");
    await use({ loginPage, dashboardPage, navigationPage });
  },
});

export { expect } from "@playwright/test";
