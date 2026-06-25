import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

/**
 * Project Creation — Project Type × Version Matrix @project-creation @version-matrix
 *
 * Tests the form-level differences between V1 and V2 for each project type.
 * These are UI interaction tests — they verify the creation form behaves
 * correctly when switching versions, NOT the full E2E pipeline.
 *
 * Matrix (6 tests):
 *   1. Object Detection V1 — V1 selectable, no classification type
 *   2. Object Detection V2 — V2 default, no classification type
 *   3. Classification V1   — V1 selectable, no classification type
 *   4. Classification V2   — V2 default, classification type visible
 *   5. Segmentation V1     — V1 selectable, no classification type
 *   6. Segmentation V2     — V2 default, no classification type
 *
 * Key behavioral differences:
 *   - V2 + Classification → classification type radio (multi-label / single-label) appears
 *   - Switching V2 → V1 for classification → classification type radio disappears
 *   - V1 Segmentation auto-creates "background" class (server-side, not tested here)
 */

test.describe("Project Creation — Type × Version Matrix @project-creation @version-matrix", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  test.beforeEach(async ({ loginPage, projectCreationPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectCreationPage.goto();
  });

  // ─── Object Detection ────────────────────────────────────────────────────

  test.describe("Object Detection", () => {
    test.beforeEach(async ({ projectCreationPage }) => {
      await projectCreationPage.selectType("object_detection");
    });

    test("V1 — version selectable, form submittable, no classification type", async ({
      projectCreationPage,
      consoleErrors,
    }) => {
      // V2 is the default
      expect(await projectCreationPage.isVersionSelected("v2")).toBe(true);

      // Switch to V1
      await projectCreationPage.selectVersion("v1");
      expect(await projectCreationPage.isVersionSelected("v1")).toBe(true);

      // Classification type should NOT appear for object detection
      expect(await projectCreationPage.isClassificationTypeVisible()).toBe(false);

      // Form should be submittable after filling name
      await projectCreationPage.fillName("OD V1 Test");
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      consoleErrors.assertNoErrors();
    });

    test("V2 — default version, no classification type", async ({
      projectCreationPage,
      consoleErrors,
    }) => {
      // V2 should be the default
      expect(await projectCreationPage.isVersionSelected("v2")).toBe(true);

      // Classification type should NOT appear for object detection
      expect(await projectCreationPage.isClassificationTypeVisible()).toBe(false);

      // Form should be submittable after filling name
      await projectCreationPage.fillName("OD V2 Test");
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      consoleErrors.assertNoErrors();
    });
  });

  // ─── Classification ──────────────────────────────────────────────────────

  test.describe("Classification", () => {
    test.beforeEach(async ({ projectCreationPage }) => {
      await projectCreationPage.selectType("classification");
    });

    test("V1 — version selectable, classification type hidden", async ({
      projectCreationPage,
      consoleErrors,
    }) => {
      // V2 is the default — classification type should be visible
      expect(await projectCreationPage.isVersionSelected("v2")).toBe(true);
      expect(await projectCreationPage.isClassificationTypeVisible()).toBe(true);

      // Switch to V1 — classification type should disappear
      await projectCreationPage.selectVersion("v1");
      expect(await projectCreationPage.isVersionSelected("v1")).toBe(true);
      expect(await projectCreationPage.isClassificationTypeVisible()).toBe(false);

      // Form should be submittable
      await projectCreationPage.fillName("CLS V1 Test");
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      consoleErrors.assertNoErrors();
    });

    test("V2 — classification type visible, multi-label selected by default", async ({
      projectCreationPage,
      consoleErrors,
    }) => {
      // V2 is the default
      expect(await projectCreationPage.isVersionSelected("v2")).toBe(true);

      // Classification type should be visible for V2 + classification
      expect(await projectCreationPage.isClassificationTypeVisible()).toBe(true);

      // Multi-label should be the default
      expect(
        await projectCreationPage.isClassificationTypeSelected("multi-label")
      ).toBe(true);

      // Should be able to switch to single-label
      await projectCreationPage.selectClassificationType("single-label");
      expect(
        await projectCreationPage.isClassificationTypeSelected("single-label")
      ).toBe(true);

      // Switch back to multi-label
      await projectCreationPage.selectClassificationType("multi-label");
      expect(
        await projectCreationPage.isClassificationTypeSelected("multi-label")
      ).toBe(true);

      // Form should be submittable
      await projectCreationPage.fillName("CLS V2 Test");
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      consoleErrors.assertNoErrors();
    });
  });

  // ─── Segmentation ────────────────────────────────────────────────────────

  test.describe("Segmentation", () => {
    test.beforeEach(async ({ projectCreationPage }) => {
      await projectCreationPage.selectType("segmentation");
    });

    test("V1 — version selectable, no classification type", async ({
      projectCreationPage,
      consoleErrors,
    }) => {
      // V2 is the default
      expect(await projectCreationPage.isVersionSelected("v2")).toBe(true);

      // Switch to V1
      await projectCreationPage.selectVersion("v1");
      expect(await projectCreationPage.isVersionSelected("v1")).toBe(true);

      // Classification type should NOT appear for segmentation
      expect(await projectCreationPage.isClassificationTypeVisible()).toBe(false);

      // Form should be submittable after filling name
      await projectCreationPage.fillName("SEG V1 Test");
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      consoleErrors.assertNoErrors();
    });

    test("V2 — default version, no classification type", async ({
      projectCreationPage,
      consoleErrors,
    }) => {
      // V2 should be the default
      expect(await projectCreationPage.isVersionSelected("v2")).toBe(true);

      // Classification type should NOT appear for segmentation
      expect(await projectCreationPage.isClassificationTypeVisible()).toBe(false);

      // Form should be submittable after filling name
      await projectCreationPage.fillName("SEG V2 Test");
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      consoleErrors.assertNoErrors();
    });
  });
});
