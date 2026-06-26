import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockProjects,
  mockDistillGraphQL,
} from "../../src/helpers/instant-distill-helpers";

/**
 * Instant Distill — Create Page Tests @instant-distill @create
 *
 * Covers the project creation form at /instant-distill/create (Step 1):
 *   - Page layout and element visibility
 *   - Project type selection (OD / CLS / SEG)
 *   - Classification sub-type radio (only for classification)
 *   - Name input and form validation
 *   - Next button state management
 *   - Navigation to build step
 *
 * All GraphQL calls are mocked — no real projects are created.
 *
 * Test matrix (11 tests):
 *   1.  Page loads with root element visible                  @smoke
 *   2.  All three type cards visible                          @smoke
 *   3.  Next button visible and initially disabled
 *   4.  Select object detection marks card selected
 *   5.  Select classification marks card selected
 *   6.  Select segmentation marks card selected
 *   7.  Classification radio hidden for non-classification types
 *   8.  Classification radio visible for classification type
 *   9.  Name input accepts text
 *  10.  Next button enabled after type and name filled
 *  11.  Next navigates to build step
 */

// ─── Block 1: Layout ─────────────────────────────────────────────────────────

test.describe(
  "Instant Distill Create — Layout @instant-distill @create @smoke",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillCreatePage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, createMockProjects(0));
        await instantDistillCreatePage.goto();
      }
    );

    test("page loads with root element visible", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      expect(await instantDistillCreatePage.isLoaded()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("all three type cards visible", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      expect(
        await instantDistillCreatePage.isTypeCardVisible("object_detection")
      ).toBe(true);
      expect(
        await instantDistillCreatePage.isTypeCardVisible("classification")
      ).toBe(true);
      expect(
        await instantDistillCreatePage.isTypeCardVisible("segmentation")
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("next button visible and initially disabled", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      expect(
        await instantDistillCreatePage.isNextButtonVisible()
      ).toBe(true);
      expect(
        await instantDistillCreatePage.isNextButtonDisabled()
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 2: Type Selection ─────────────────────────────────────────────────

test.describe(
  "Instant Distill Create — Type Selection @instant-distill @create",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillCreatePage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, createMockProjects(0));
        await instantDistillCreatePage.goto();
      }
    );

    test("select object detection marks card selected", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      await instantDistillCreatePage.selectType("object_detection");

      expect(
        await instantDistillCreatePage.isTypeSelected("object_detection")
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("select classification marks card selected", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      await instantDistillCreatePage.selectType("classification");

      expect(
        await instantDistillCreatePage.isTypeSelected("classification")
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });

    test("select segmentation marks card selected", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      await instantDistillCreatePage.selectType("segmentation");

      expect(
        await instantDistillCreatePage.isTypeSelected("segmentation")
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 3: Classification Sub-Type ────────────────────────────────────────

test.describe(
  "Instant Distill Create — Classification Sub-Type @instant-distill @create",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillCreatePage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, createMockProjects(0));
        await instantDistillCreatePage.goto();
      }
    );

    test("classification radio hidden for non-classification types", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      await instantDistillCreatePage.selectType("object_detection");

      expect(
        await instantDistillCreatePage.isClassificationTypeVisible()
      ).toBe(false);
      consoleErrors.assertNoErrors();
    });

    test("classification radio visible for classification type", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      await instantDistillCreatePage.selectType("classification");

      expect(
        await instantDistillCreatePage.isClassificationTypeVisible()
      ).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ─── Block 4: Form & Navigation ──────────────────────────────────────────────

test.describe(
  "Instant Distill Create — Form & Navigation @instant-distill @create",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(
      async ({ loginPage, instantDistillCreatePage, page }) => {
        await loginPage.loginAs("admin");
        const error = await loginPage.getLoginErrorMessage();
        test.skip(!!error, `Login blocked by environment: ${error}`);

        await mockDistillGraphQL(page, createMockProjects(0));
        await instantDistillCreatePage.goto();
      }
    );

    test("name input accepts text", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      await instantDistillCreatePage.fillName("Test Project Alpha");

      const value = await instantDistillCreatePage.getNameValue();
      expect(value).toBe("Test Project Alpha");
      consoleErrors.assertNoErrors();
    });

    test("next button enabled after type and name filled", async ({
      instantDistillCreatePage,
      consoleErrors,
    }) => {
      // Initially disabled
      expect(
        await instantDistillCreatePage.isNextButtonDisabled()
      ).toBe(true);

      // Select type and fill name
      await instantDistillCreatePage.selectType("object_detection");
      await instantDistillCreatePage.fillName("My Project");

      // Now should be enabled
      expect(
        await instantDistillCreatePage.isNextButtonDisabled()
      ).toBe(false);
      consoleErrors.assertNoErrors();
    });

    test("next navigates to build step", async ({
      instantDistillCreatePage,
      consoleErrors,
      page,
    }) => {
      await instantDistillCreatePage.selectType("object_detection");
      await instantDistillCreatePage.fillName("Nav Test Project");

      await instantDistillCreatePage.clickNext();

      // Should navigate to the build step (/:id/build or /instant-distill/.../build)
      await expect(page).toHaveURL(/\/instant-distill\/.+\/build/, {
        timeout: 15_000,
      });
      consoleErrors.assertNoErrors();
    });
  }
);
