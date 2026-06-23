import { test as base } from "@playwright/test";
import { LoginPage, DashboardPage, NavigationPage } from "../pages";

/**
 * Custom fixtures that inject Page Objects into every test.
 * Usage: `test('my test', async ({ loginPage, dashboardPage }) => { ... })`
 */
export type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  navigationPage: NavigationPage;
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
});

export { expect } from "@playwright/test";
