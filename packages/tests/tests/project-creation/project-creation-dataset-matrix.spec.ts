import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import { createApiHelper } from "../../src/helpers/api-helper";
import { timestamp } from "../../src/helpers/data-generator";

/**
 * Project Creation — Dataset Type Matrix @project-creation @dataset-matrix
 *
 * Tests which dataset upload types and label formats are available
 * for each project type on the upload page (upload-v2 component).
 *
 * Conditional logic from upload-v2.component.ts:
 *   - "Labelled Images" dropdown option: projectType === "object_detection" || platformVersion === "v2"
 *   - YOLO + COCO radio items: projectType !== "segmentation" (i.e. OD and CLS get both)
 *   - COCO only: all segmentation projects (V1 and V2)
 *   - "Unlabelled Images" and "Video": always available
 *
 * Test matrix (9 tests):
 *   OD V2  — Labelled YOLO        (YOLO + COCO both available)
 *   OD V2  — Labelled COCO        (YOLO + COCO both available)
 *   OD V2  — Unlabelled Images    (files + folder upload)
 *   OD V2  — Video                (single video file)
 *   CLS V2 — Labelled COCO        (YOLO + COCO both available)
 *   CLS V2 — Unlabelled Images    (files + folder upload)
 *   CLS V2 — Video                (single video file)
 *   SEG V2 — Labelled COCO        (COCO only, YOLO not available)
 *   SEG V2 — Unlabelled Images    (files + folder upload)
 *
 * Each describe block creates ONE project via the UI in beforeEach
 * and archives it in afterEach.
 */

const RUN_TAG = `ds-matrix-${timestamp()}`;

type ProjectType = "object_detection" | "classification" | "segmentation";

/**
 * Navigate to project creation, create a project of the given type (V2),
 * click "Upload Dataset Now", and wait for the upload page to load.
 * Returns the project ID extracted from the URL.
 */
async function createProjectAndNavigateToUpload(
  projectType: ProjectType,
  fixtures: {
    loginPage: any;
    projectCreationPage: any;
    uploadDatasetPage: any;
    consoleErrors: any;
    page: any;
  }
): Promise<string> {
  const { loginPage, projectCreationPage, uploadDatasetPage, consoleErrors, page } = fixtures;

  await loginPage.loginAs("admin");
  const error = await loginPage.getLoginErrorMessage();
  test.skip(!!error, `Login blocked by environment: ${error}`);

  const projectName = `DS ${projectType} V2 | ${RUN_TAG}`;

  await projectCreationPage.goto();
  await projectCreationPage.selectType(projectType);
  await projectCreationPage.fillName(projectName);
  await projectCreationPage.clickSubmit();

  expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
  consoleErrors.assertNoErrors();

  await projectCreationPage.clickUploadDatasetNow();
  await expect(page).toHaveURL(/\/dataset\/.+\/add/, { timeout: 15_000 });

  await uploadDatasetPage.waitForReady();
  consoleErrors.assertNoErrors();

  const url: string = page.url();
  const match = url.match(/\/dataset\/([^/]+)\//);
  return match ? match[1] : "";
}

// ─── Object Detection V2 ─────────────────────────────────────────────────────

test.describe("Dataset Matrix — Object Detection V2 @project-creation @dataset-matrix @object-detection", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | undefined;

  test.beforeEach(
    async ({ loginPage, projectCreationPage, uploadDatasetPage, consoleErrors, page }) => {
      projectId = await createProjectAndNavigateToUpload("object_detection", {
        loginPage,
        projectCreationPage,
        uploadDatasetPage,
        consoleErrors,
        page,
      });
    }
  );

  test.afterEach(async ({ page }) => {
    if (!projectId) return;
    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${projectId}`, { archived: true });
    } catch {
      // Best-effort cleanup
    }
  });

  test("labelled YOLO — both YOLO and COCO label formats available", async ({
    uploadDatasetPage,
    consoleErrors,
  }) => {
    // "Labelled Images" should be available for object detection (any version)
    expect(await uploadDatasetPage.isDatasetTypeOptionAvailable("labelled")).toBe(true);

    // Select labelled to reveal the label format radio
    await uploadDatasetPage.selectDatasetType("labelled");
    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(true);

    // Both YOLO and COCO should be available for object detection
    expect(await uploadDatasetPage.isLabelFormatOptionVisible("yolo")).toBe(true);
    expect(await uploadDatasetPage.isLabelFormatOptionVisible("coco")).toBe(true);

    // YOLO should be selectable
    await uploadDatasetPage.selectLabelFormat("yolo");

    // ZIP file input should be present for labelled uploads
    expect(await uploadDatasetPage.isUploadButtonVisible()).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("labelled COCO — both YOLO and COCO label formats available", async ({
    uploadDatasetPage,
    consoleErrors,
  }) => {
    await uploadDatasetPage.selectDatasetType("labelled");
    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(true);

    // Both formats available
    expect(await uploadDatasetPage.isLabelFormatOptionVisible("yolo")).toBe(true);
    expect(await uploadDatasetPage.isLabelFormatOptionVisible("coco")).toBe(true);

    // COCO should be selectable
    await uploadDatasetPage.selectLabelFormat("coco");
    consoleErrors.assertNoErrors();
  });

  test("unlabelled images — file and folder upload available", async ({
    uploadDatasetPage,
    consoleErrors,
    page,
  }) => {
    // Default dataset type is "unlabelled" — should already be selected
    // "Select Files" and "Select Folder" buttons should be visible
    const selectFiles = page.locator("#dataset-flow-upload-select-files").first();
    const selectFolder = page.locator("#dataset-flow-upload-select-folder").first();

    expect(await selectFiles.isVisible().catch(() => false)).toBe(true);
    expect(await selectFolder.isVisible().catch(() => false)).toBe(true);

    // Label format radio should NOT be visible for unlabelled
    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(false);
    consoleErrors.assertNoErrors();
  });

  test("video — single file upload input available", async ({
    uploadDatasetPage,
    consoleErrors,
    page,
  }) => {
    await uploadDatasetPage.selectDatasetType("video");

    // Video file input should be present
    const videoInput = page.locator("#dataset-flow-upload-video-input").first();
    expect(await videoInput.isVisible().catch(() => false)).toBe(true);

    // Label format radio should NOT be visible for video
    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(false);
    consoleErrors.assertNoErrors();
  });
});

// ─── Classification V2 ───────────────────────────────────────────────────────

test.describe("Dataset Matrix — Classification V2 @project-creation @dataset-matrix @classification", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | undefined;

  test.beforeEach(
    async ({ loginPage, projectCreationPage, uploadDatasetPage, consoleErrors, page }) => {
      projectId = await createProjectAndNavigateToUpload("classification", {
        loginPage,
        projectCreationPage,
        uploadDatasetPage,
        consoleErrors,
        page,
      });
    }
  );

  test.afterEach(async ({ page }) => {
    if (!projectId) return;
    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${projectId}`, { archived: true });
    } catch {
      // Best-effort cleanup
    }
  });

  test("labelled COCO — both YOLO and COCO label formats available", async ({
    uploadDatasetPage,
    consoleErrors,
  }) => {
    // "Labelled Images" should be available for V2 projects (any type)
    expect(await uploadDatasetPage.isDatasetTypeOptionAvailable("labelled")).toBe(true);

    await uploadDatasetPage.selectDatasetType("labelled");
    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(true);

    // Code allows YOLO + COCO for classification (projectType !== "segmentation")
    expect(await uploadDatasetPage.isLabelFormatOptionVisible("yolo")).toBe(true);
    expect(await uploadDatasetPage.isLabelFormatOptionVisible("coco")).toBe(true);

    await uploadDatasetPage.selectLabelFormat("coco");
    consoleErrors.assertNoErrors();
  });

  test("unlabelled images — file and folder upload available", async ({
    uploadDatasetPage,
    consoleErrors,
    page,
  }) => {
    const selectFiles = page.locator("#dataset-flow-upload-select-files").first();
    const selectFolder = page.locator("#dataset-flow-upload-select-folder").first();

    expect(await selectFiles.isVisible().catch(() => false)).toBe(true);
    expect(await selectFolder.isVisible().catch(() => false)).toBe(true);

    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(false);
    consoleErrors.assertNoErrors();
  });

  test("video — single file upload input available", async ({
    uploadDatasetPage,
    consoleErrors,
    page,
  }) => {
    await uploadDatasetPage.selectDatasetType("video");

    const videoInput = page.locator("#dataset-flow-upload-video-input").first();
    expect(await videoInput.isVisible().catch(() => false)).toBe(true);

    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(false);
    consoleErrors.assertNoErrors();
  });
});

// ─── Segmentation V2 ─────────────────────────────────────────────────────────

test.describe("Dataset Matrix — Segmentation V2 @project-creation @dataset-matrix @segmentation", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | undefined;

  test.beforeEach(
    async ({ loginPage, projectCreationPage, uploadDatasetPage, consoleErrors, page }) => {
      projectId = await createProjectAndNavigateToUpload("segmentation", {
        loginPage,
        projectCreationPage,
        uploadDatasetPage,
        consoleErrors,
        page,
      });
    }
  );

  test.afterEach(async ({ page }) => {
    if (!projectId) return;
    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${projectId}`, { archived: true });
    } catch {
      // Best-effort cleanup
    }
  });

  test("labelled COCO — only COCO available, YOLO hidden for segmentation", async ({
    uploadDatasetPage,
    consoleErrors,
  }) => {
    // "Labelled Images" available for V2 projects
    expect(await uploadDatasetPage.isDatasetTypeOptionAvailable("labelled")).toBe(true);

    await uploadDatasetPage.selectDatasetType("labelled");
    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(true);

    // Segmentation: COCO only — YOLO should NOT be available
    expect(await uploadDatasetPage.isLabelFormatOptionVisible("coco")).toBe(true);
    expect(await uploadDatasetPage.isLabelFormatOptionVisible("yolo")).toBe(false);

    consoleErrors.assertNoErrors();
  });

  test("unlabelled images — file and folder upload available", async ({
    uploadDatasetPage,
    consoleErrors,
    page,
  }) => {
    const selectFiles = page.locator("#dataset-flow-upload-select-files").first();
    const selectFolder = page.locator("#dataset-flow-upload-select-folder").first();

    expect(await selectFiles.isVisible().catch(() => false)).toBe(true);
    expect(await selectFolder.isVisible().catch(() => false)).toBe(true);

    expect(await uploadDatasetPage.isLabelFormatVisible()).toBe(false);
    consoleErrors.assertNoErrors();
  });
});
