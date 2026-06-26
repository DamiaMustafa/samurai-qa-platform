import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockEdgeDeviceList,
  mockAllEdgeAPIs,
} from "../../src/helpers/edge-management-helpers";

/**
 * Edge Management — List Page Tests @edge @list
 *
 * Covers the device listing at /edge-management:
 *   - Page layout and element visibility
 *   - Console error assertions after every interaction
 *
 * All API calls are mocked — no real devices are created.
 *
 * Test matrix (5 tests):
 *   1.  Page loads with root element visible                  @smoke
 *   2.  Title visible in header
 *   3.  Add Server button visible
 *   4.  Device table visible
 *   5.  Pagination controls visible
 */

// ─── Block 1: Layout ─────────────────────────────────────────────────────────

test.describe(
  "Edge Management List — Layout @edge @list @smoke",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    const mockDevices = createMockEdgeDeviceList(5);

    test.beforeEach(
      async ({ loginPage, edgeManagementPage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockAllEdgeAPIs(page, mockDevices);
        await edgeManagementPage.goto();
      }
    );

    test("page loads with root element visible", async ({
      edgeManagementPage,
      consoleErrors,
    }) => {
      expect(await edgeManagementPage.isLoaded()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("title visible in header", async ({
      edgeManagementPage,
      consoleErrors,
    }) => {
      expect(await edgeManagementPage.isTitleVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("Add Server button visible", async ({
      edgeManagementPage,
      consoleErrors,
    }) => {
      expect(await edgeManagementPage.isAddServerButtonVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("device table visible", async ({
      edgeManagementPage,
      consoleErrors,
    }) => {
      expect(await edgeManagementPage.isTableVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("pagination controls visible", async ({
      edgeManagementPage,
      consoleErrors,
    }) => {
      expect(await edgeManagementPage.isPaginationVisible()).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);