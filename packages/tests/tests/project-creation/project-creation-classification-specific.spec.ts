import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import { createApiHelper } from "../../src/helpers/api-helper";

/**
 * Project Creation — Classification Specific @project-creation @classification-specific
 *
 * Verifies the V2-only classification type feature:
 *   - Multi-label classification: an image can have multiple labels
 *   - Single-label classification: each image gets exactly one label
 *
 * The classification type radio group appears ONLY when:
 *   version === "v2" AND type === "classification"
 *
 * The selected value is sent as `multiLabel` (boolean) in the
 * createProjectBilling GraphQL mutation payload.
 *
 * These tests intercept the API request to verify the correct
 * `multiLabel` value is sent for each classification type.
 *
 * Test matrix (2 tests):
 *   1. Multi-label — default, multiLabel: true
 *   2. Single-label — explicitly selected, multiLabel: false
 */

test.describe("Project Creation — Classification Specific @project-creation @classification-specific", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let createdProjectId: string | undefined;

  test.beforeEach(async ({ loginPage, projectCreationPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await projectCreationPage.goto();
    createdProjectId = undefined;
  });

  test.afterEach(async ({ page }) => {
    if (!createdProjectId) return;
    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${createdProjectId}`, { archived: true });
    } catch {
      // Best-effort cleanup
    }
  });

  // ─── Multi-label (default) ───────────────────────────────────────────────

  test("Multi-label classification — sends multiLabel: true in API payload", async ({
    projectCreationPage,
    consoleErrors,
    page,
  }) => {
    // Select classification type
    await projectCreationPage.selectType("classification");

    // V2 is default — classification type should be visible
    expect(await projectCreationPage.isClassificationTypeVisible()).toBe(true);

    // Multi-label should be the default selection
    expect(
      await projectCreationPage.isClassificationTypeSelected("multi-label")
    ).toBe(true);
    consoleErrors.assertNoErrors();

    // Fill name to enable submit
    await projectCreationPage.fillName("CLS Multi-label Test");
    expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

    // Intercept the GraphQL request to verify the payload
    let capturedMultiLabel: boolean | undefined;

    page.on("request", (request) => {
      try {
        const postData = request.postData();
        if (!postData || !postData.includes("createProjectBilling")) return;

        const body = JSON.parse(postData);
        const projectInfoStr = body?.variables?.projectInfo;
        if (!projectInfoStr) return;

        const projectInfo = JSON.parse(projectInfoStr);
        capturedMultiLabel = projectInfo.multiLabel;
      } catch {
        // Ignore parse errors from unrelated requests
      }
    });

    // Submit the form
    await projectCreationPage.clickSubmit();

    // Wait for success dialog
    expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
    consoleErrors.assertNoErrors();

    // Verify the API received multiLabel: true
    expect(capturedMultiLabel).toBe(true);

    // Extract project ID for cleanup
    await projectCreationPage.clickUploadDatasetNow();
    const url = page.url();
    const match = url.match(/\/dataset\/([^/]+)\//);
    createdProjectId = match ? match[1] : undefined;
  });

  // ─── Single-label ────────────────────────────────────────────────────────

  test("Single-label classification — sends multiLabel: false in API payload", async ({
    projectCreationPage,
    consoleErrors,
    page,
  }) => {
    // Select classification type
    await projectCreationPage.selectType("classification");

    // V2 is default — classification type should be visible
    expect(await projectCreationPage.isClassificationTypeVisible()).toBe(true);

    // Switch to single-label
    await projectCreationPage.selectClassificationType("single-label");
    expect(
      await projectCreationPage.isClassificationTypeSelected("single-label")
    ).toBe(true);
    consoleErrors.assertNoErrors();

    // Fill name to enable submit
    await projectCreationPage.fillName("CLS Single-label Test");
    expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

    // Intercept the GraphQL request to verify the payload
    let capturedMultiLabel: boolean | undefined;

    page.on("request", (request) => {
      try {
        const postData = request.postData();
        if (!postData || !postData.includes("createProjectBilling")) return;

        const body = JSON.parse(postData);
        const projectInfoStr = body?.variables?.projectInfo;
        if (!projectInfoStr) return;

        const projectInfo = JSON.parse(projectInfoStr);
        capturedMultiLabel = projectInfo.multiLabel;
      } catch {
        // Ignore parse errors from unrelated requests
      }
    });

    // Submit the form
    await projectCreationPage.clickSubmit();

    // Wait for success dialog
    expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
    consoleErrors.assertNoErrors();

    // Verify the API received multiLabel: false
    expect(capturedMultiLabel).toBe(false);

    // Extract project ID for cleanup
    await projectCreationPage.clickUploadDatasetNow();
    const url = page.url();
    const match = url.match(/\/dataset\/([^/]+)\//);
    createdProjectId = match ? match[1] : undefined;
  });
});
