import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockProjects,
  mockDistillGraphQL,
} from "../../src/helpers/instant-distill-helpers";

/**
 * Instant Distill — Integrate Page Tests @instant-distill @integrate
 *
 * Covers the integrate step at /instant-distill/:id/integrate (Step 3):
 *   - Page layout and API panel visibility
 *   - API code block content
 *   - Copy actions (endpoint, code)
 *   - RouterLink buttons (Create API Key, Go to API Keys)
 *   - Back navigation to build step
 *
 * All GraphQL calls are mocked — no real API calls are made.
 *
 * Test matrix (9 tests):
 *   1.  Page loads with root element visible                  @smoke
 *   2.  API panel visible                                     @smoke
 *   3.  Integrate button visible
 *   4.  API code block contains text
 *   5.  Copy endpoint button does not throw
 *   6.  Create API key button visible
 *   7.  Go to API keys button visible
 *   8.  Copy code button does not throw
 *   9.  Back navigates to build step
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const MOCK_PROJECT_ID = "mock-integrate-1";

// ─── Block 1: Layout ─────────────────────────────────────────────────────────

test.describe(
  "Instant Distill Integrate — Layout @instant-distill @integrate @smoke",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillIntegratePage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, createMockProjects(1, "Integrate Test"));
        await instantDistillIntegratePage.goto(MOCK_PROJECT_ID);
      }
    );

    test("page loads with root element visible", async ({
      instantDistillIntegratePage,
      consoleErrors,
    }) => {
      expect(await instantDistillIntegratePage.isLoaded()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("API panel visible", async ({
      instantDistillIntegratePage,
      consoleErrors,
    }) => {
      expect(
        await instantDistillIntegratePage.isApiPanelVisible()
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("integrate button visible", async ({
      instantDistillIntegratePage,
      consoleErrors,
    }) => {
      expect(
        await instantDistillIntegratePage.isIntegrateVisible()
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 2: API Panel ──────────────────────────────────────────────────────

test.describe(
  "Instant Distill Integrate — API Panel @instant-distill @integrate",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillIntegratePage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, createMockProjects(1, "Integrate Test"));
        await instantDistillIntegratePage.goto(MOCK_PROJECT_ID);
      }
    );

    test("API code block contains text", async ({
      instantDistillIntegratePage,
      consoleErrors,
    }) => {
      const code = await instantDistillIntegratePage.getApiCodeText();
      expect(code.length).toBeGreaterThan(0);
      consoleErrors.assertNoErrors();
    });

    test("copy endpoint button does not throw", async ({
      instantDistillIntegratePage,
      consoleErrors,
    }) => {
      await instantDistillIntegratePage.clickCopyEndpoint();
      consoleErrors.assertNoErrors();
    });

    test("copy code button does not throw", async ({
      instantDistillIntegratePage,
      consoleErrors,
    }) => {
      await instantDistillIntegratePage.clickCopyCode();
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 3: RouterLink Buttons ─────────────────────────────────────────────

test.describe(
  "Instant Distill Integrate — RouterLink Buttons @instant-distill @integrate",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillIntegratePage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, createMockProjects(1, "Integrate Test"));
        await instantDistillIntegratePage.goto(MOCK_PROJECT_ID);
      }
    );

    test("create API key button visible", async ({
      instantDistillIntegratePage,
      consoleErrors,
    }) => {
      expect(
        await instantDistillIntegratePage.isCreateApiKeyButtonVisible()
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("go to API keys button visible", async ({
      instantDistillIntegratePage,
      consoleErrors,
    }) => {
      expect(
        await instantDistillIntegratePage.isGoApiKeysButtonVisible()
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 4: Navigation ─────────────────────────────────────────────────────

test.describe(
  "Instant Distill Integrate — Navigation @instant-distill @integrate",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillIntegratePage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, createMockProjects(1, "Integrate Test"));
        await instantDistillIntegratePage.goto(MOCK_PROJECT_ID);
      }
    );

    test("back navigates to build step", async ({
      instantDistillIntegratePage,
      consoleErrors,
      page,
    }) => {
      await instantDistillIntegratePage.clickBack();

      await expect(page).toHaveURL(/\/instant-distill\/.+\/build/, {
        timeout: 15_000,
      });
      consoleErrors.assertNoErrors();
    });
  }
);
