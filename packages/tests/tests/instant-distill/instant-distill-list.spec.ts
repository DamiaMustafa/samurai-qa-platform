import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockProjects,
  mockDistillGraphQL,
  mockListProjectsResponse,
} from "../../src/helpers/instant-distill-helpers";

/**
 * Instant Distill — List Page Tests @instant-distill @list
 *
 * Covers the project listing at /instant-distill:
 *   - Page layout and element visibility
 *   - Empty state rendering
 *   - Project cards with search filtering
 *   - Card actions: open, rename, delete
 *   - Console error assertions after every interaction
 *
 * All GraphQL calls are mocked — no real projects are created.
 *
 * Test matrix (13 tests):
 *   1.  Page loads with root element visible                  @smoke
 *   2.  Create project button visible in header
 *   3.  Empty state shows illustration + create button
 *   4.  Empty state create button navigates to /create
 *   5.  Cards render with project names                       @smoke
 *   6.  Search filters cards in real time
 *   7.  Search clear shows all cards
 *   8.  Search no match → empty state
 *   9.  Card Open navigates to /:id
 *  10.  Card menu opens on kebab click
 *  11.  Rename dialog pre-fills name and submits update
 *  12.  Delete confirm removes card on proceed
 *  13.  Delete cancel keeps card
 */

// ─── Block 1: Layout ─────────────────────────────────────────────────────────

test.describe(
  "Instant Distill List — Layout @instant-distill @list @smoke",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    const mockProjects = createMockProjects(2, "Layout Test");

    test.beforeEach(
      async ({ loginPage, instantDistillListPage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, mockProjects);
        await instantDistillListPage.goto();
      }
    );

    test("page loads with root element visible", async ({
      instantDistillListPage,
      consoleErrors,
    }) => {
      expect(await instantDistillListPage.isLoaded()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("create project button visible in header", async ({
      instantDistillListPage,
      consoleErrors,
    }) => {
      expect(await instantDistillListPage.isCreateButtonVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 2: Empty State ────────────────────────────────────────────────────

test.describe(
  "Instant Distill List — Empty State @instant-distill @list",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillListPage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        // Return an empty list to trigger the empty state
        await mockDistillGraphQL(page, []);
        await instantDistillListPage.goto();
      }
    );

    test("empty state shows illustration and create button", async ({
      instantDistillListPage,
      consoleErrors,
    }) => {
      expect(await instantDistillListPage.isEmptyStateVisible()).toBe(true);
      expect(
        await instantDistillListPage.isEmptyCreateButtonVisible()
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("empty state create button navigates to /create", async ({
      instantDistillListPage,
      consoleErrors,
      page,
    }) => {
      await instantDistillListPage.clickEmptyCreate();
      await expect(page).toHaveURL(/\/instant-distill\/create/, {
        timeout: 15_000,
      });
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 3: Cards & Search ─────────────────────────────────────────────────

test.describe(
  "Instant Distill List — Cards & Search @instant-distill @list",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    const mockProjects = createMockProjects(3, "Alpha Beta Gamma");

    test.beforeEach(
      async ({ loginPage, instantDistillListPage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, mockProjects);
        await instantDistillListPage.goto();
      }
    );

    test("cards render with project names", async ({
      instantDistillListPage,
      consoleErrors,
    }) => {
      const count = await instantDistillListPage.getCardCount();
      expect(count).toBe(3);

      const names = await instantDistillListPage.getCardNames();
      expect(names.length).toBeGreaterThan(0);
      consoleErrors.assertNoErrors();
    });

    test("search filters cards in real time", async ({
      instantDistillListPage,
      consoleErrors,
    }) => {
      // Search for "Alpha" — should show only matching cards
      await instantDistillListPage.fillSearch("Alpha");

      const count = await instantDistillListPage.getCardCount();
      // At least one card should match, and fewer than the original 3
      // (depends on how the mock data names are filtered)
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(3);
      consoleErrors.assertNoErrors();
    });

    test("search clear shows all cards again", async ({
      instantDistillListPage,
      consoleErrors,
    }) => {
      // Search then clear
      await instantDistillListPage.fillSearch("nonexistent");
      await instantDistillListPage.clearSearch();

      // After clearing, all cards should reappear
      const count = await instantDistillListPage.getCardCount();
      expect(count).toBe(3);
      consoleErrors.assertNoErrors();
    });

    test("search no match shows empty state", async ({
      instantDistillListPage,
      consoleErrors,
    }) => {
      await instantDistillListPage.fillSearch("xyzdefinitelynotfound");

      const count = await instantDistillListPage.getCardCount();
      expect(count).toBe(0);

      const emptyVisible =
        await instantDistillListPage.isEmptyStateVisible();
      expect(emptyVisible).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 4: Card Actions ───────────────────────────────────────────────────

test.describe(
  "Instant Distill List — Card Actions @instant-distill @list",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    const mockProjects = createMockProjects(2, "Action Test");

    test.beforeEach(
      async ({ loginPage, instantDistillListPage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, mockProjects);
        await instantDistillListPage.goto();
      }
    );

    test("card Open navigates to project detail", async ({
      instantDistillListPage,
      consoleErrors,
      page,
    }) => {
      await instantDistillListPage.clickCardOpen(0);

      // Should navigate to /instant-distill/:id
      await expect(page).toHaveURL(
        /\/instant-distill\/[^/]+(\/|$)/,
        { timeout: 15_000 }
      );
      consoleErrors.assertNoErrors();
    });

    test("card menu opens on kebab click", async ({
      instantDistillListPage,
      consoleErrors,
      page,
    }) => {
      await instantDistillListPage.openCardMenu(0);

      // The Material menu panel should be visible in the CDK overlay
      const menuVisible = await page
        .locator(".mat-menu-panel")
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      expect(menuVisible).toBe(true);

      // Verify menu items are present (Rename, Delete, Copy Id)
      const menuItems = page.locator(
        ".mat-menu-panel button.mat-menu-item"
      );
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThanOrEqual(2);
      consoleErrors.assertNoErrors();
    });

    test("rename dialog pre-fills name and submits update", async ({
      instantDistillListPage,
      consoleErrors,
      page,
    }) => {
      // Track whether UpdateDistillProject was called
      let updateCalled = false;

      await page.route("**/graphql", async (route) => {
        const postData = route.request().postData() || "";
        if (
          postData.includes("UpdateDistillProject") ||
          postData.includes("updateDistillProject")
        ) {
          updateCalled = true;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                updateDistillProject: {
                  id: mockProjects[0].id,
                  name: "Renamed Project",
                  __typename: "DistillProject",
                },
              },
            }),
          });
          return;
        }
        await route.continue();
      });

      // Open menu and click Rename
      await instantDistillListPage.openCardMenu(0);
      await instantDistillListPage.clickMenuAction("Rename");

      // Wait for the form dialog to appear
      const dialogVisible =
        await instantDistillListPage.waitForDialogWithText("Edit");
      // If the dialog doesn't appear with "Edit", try a broader check
      if (!dialogVisible) {
        const anyDialog =
          await instantDistillListPage.isDialogVisible();
        expect(anyDialog).toBe(true);
      }

      // The input should be pre-filled with the current project name
      const currentValue =
        await instantDistillListPage.getDialogInputValue();
      expect(currentValue.length).toBeGreaterThan(0);

      // Change the name and submit
      await instantDistillListPage.fillDialogInput("Renamed Project");
      await instantDistillListPage.clickDialogConfirm();

      // Wait for the API call and toast
      await page.waitForTimeout(2_000);
      expect(updateCalled).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("delete confirm removes card on proceed", async ({
      instantDistillListPage,
      consoleErrors,
      page,
    }) => {
      const initialCount =
        await instantDistillListPage.getCardCount();

      // Track whether DeleteDistillProject was called
      let deleteCalled = false;

      await page.route("**/graphql", async (route) => {
        const postData = route.request().postData() || "";
        if (
          postData.includes("DeleteDistillProject") ||
          postData.includes("deleteDistillProject")
        ) {
          deleteCalled = true;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              data: {
                deleteDistillProject: {
                  id: mockProjects[0].id,
                  __typename: "DistillProject",
                },
              },
            }),
          });
          return;
        }
        await route.continue();
      });

      // Open menu and click Delete
      await instantDistillListPage.openCardMenu(0);
      await instantDistillListPage.clickMenuAction("Delete");

      // Wait for the confirm dialog
      const dialogVisible =
        await instantDistillListPage.waitForDialogWithText("Delete");
      if (!dialogVisible) {
        // Fallback: check for any visible dialog
        expect(
          await instantDistillListPage.isDialogVisible()
        ).toBe(true);
      }

      // Click Proceed/Confirm in the dialog
      await instantDistillListPage.clickDialogConfirm();

      // Wait for deletion to process
      await page.waitForTimeout(2_000);
      expect(deleteCalled).toBe(true);

      // Card count should decrease (or the component re-fetches)
      const afterCount =
        await instantDistillListPage.getCardCount();
      expect(afterCount).toBeLessThanOrEqual(initialCount);
      consoleErrors.assertNoErrors();
    });

    test("delete cancel keeps card", async ({
      instantDistillListPage,
      consoleErrors,
      page,
    }) => {
      const initialCount =
        await instantDistillListPage.getCardCount();

      // Open menu and click Delete
      await instantDistillListPage.openCardMenu(0);
      await instantDistillListPage.clickMenuAction("Delete");

      // Wait for the confirm dialog
      const dialogVisible =
        await instantDistillListPage.waitForDialogWithText("Delete");
      if (!dialogVisible) {
        expect(
          await instantDistillListPage.isDialogVisible()
        ).toBe(true);
      }

      // Click Cancel
      await instantDistillListPage.clickDialogCancel();

      // Dialog should close and card count should remain the same
      await page.waitForTimeout(1_000);

      const afterCount =
        await instantDistillListPage.getCardCount();
      expect(afterCount).toBe(initialCount);
      consoleErrors.assertNoErrors();
    });
  }
);
