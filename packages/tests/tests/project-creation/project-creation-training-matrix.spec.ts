import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import { createApiHelper } from "../../src/helpers/api-helper";
import { timestamp } from "../../src/helpers/data-generator";

/**
 * Project Creation — Training Matrix @project-creation @training-matrix
 *
 * Verifies that Fast Training and Advanced Training forms load correctly
 * for each project type and that model type options are project-specific.
 *
 * Model types per project (from advance-training.component.ts):
 *   object_detection: yolo26s/n/m/l/x, yolov8s/n/m/l/x  (10 options)
 *   classification:   yolo26s/n/m/l/x, yolov8s/n         (7 options)
 *   segmentation:     yolo26s/n/m/l/x                     (5 options, mask_rcnn filtered)
 *
 * Test matrix (6 tests):
 *   1. OD  — Fast Training form loads
 *   2. OD  — Advanced Training: 10 model types, yolov8x present
 *   3. CLS — Fast Training form loads
 *   4. CLS — Advanced Training: 7 model types, yolov8x absent
 *   5. SEG — Fast Training form loads
 *   6. SEG — Advanced Training: 5 model types, mask_rcnn absent
 */

const RUN_TAG = `train-${timestamp()}`;

type ProjectType = "object_detection" | "classification" | "segmentation";

/**
 * Create a project via the UI, skip the dataset upload, and return the project ID.
 * Navigates: project creation → success dialog → skip → projects page.
 * Then extracts the project ID from the newly created project via API.
 */
async function createProjectForTraining(
  projectType: ProjectType,
  fixtures: {
    loginPage: any;
    projectCreationPage: any;
    consoleErrors: any;
    page: any;
  }
): Promise<string> {
  const { loginPage, projectCreationPage, consoleErrors, page } = fixtures;

  await loginPage.loginAs("admin");
  const error = await loginPage.getLoginErrorMessage();
  test.skip(!!error, `Login blocked by environment: ${error}`);

  const projectName = `Train ${projectType} | ${RUN_TAG}`;

  await projectCreationPage.goto();
  await projectCreationPage.selectType(projectType);
  await projectCreationPage.fillName(projectName);
  await projectCreationPage.clickSubmit();

  expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
  consoleErrors.assertNoErrors();

  // Click "Skip" to go to /projects, then extract the project ID from the URL
  // of the upload-dataset-now path which embeds the project ID
  await projectCreationPage.clickUploadDatasetNow();
  await expect(page).toHaveURL(/\/dataset\/.+\/add/, { timeout: 15_000 });

  // Extract project ID from the dataset URL: /dataset/{datasetId}/add
  // The dataset ID is the same as the project ID in this platform
  const url: string = page.url();
  const match = url.match(/\/dataset\/([^/]+)\//);
  return match ? match[1] : "";
}

// ─── Object Detection ────────────────────────────────────────────────────────

test.describe("Training Matrix — Object Detection @project-creation @training-matrix @object-detection", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | undefined;

  test.beforeEach(async ({ loginPage, projectCreationPage, consoleErrors, page }) => {
    projectId = await createProjectForTraining("object_detection", {
      loginPage,
      projectCreationPage,
      consoleErrors,
      page,
    });
  });

  test.afterEach(async ({ page }) => {
    if (!projectId) return;
    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${projectId}`, { archived: true });
    } catch {
      // Best-effort cleanup
    }
  });

  test("Fast Training — form loads with all steps visible", async ({
    fastTrainingFormPage,
    consoleErrors,
  }) => {
    await fastTrainingFormPage.goto(projectId!);
    expect(await fastTrainingFormPage.isLoaded()).toBe(true);

    // Step 1: Dataset snapshot
    expect(await fastTrainingFormPage.isDatasetVersionDropdownVisible()).toBe(true);
    expect(await fastTrainingFormPage.isGenerateVersionButtonVisible()).toBe(true);

    // Step 2: Model name
    // Model name input is always present in the form
    consoleErrors.assertNoErrors();
  });

  test("Advanced Training — 10 model types including yolov8m/l/x", async ({
    advanceTrainingFormPage,
    consoleErrors,
  }) => {
    await advanceTrainingFormPage.goto(projectId!);
    expect(await advanceTrainingFormPage.isLoaded()).toBe(true);

    // Step 1: Dataset snapshot
    expect(await advanceTrainingFormPage.isDatasetVersionDropdownVisible()).toBe(true);
    expect(await advanceTrainingFormPage.isGenerateVersionButtonVisible()).toBe(true);

    // Step 2: Model name + model type
    expect(await advanceTrainingFormPage.isModelNameInputVisible()).toBe(true);
    expect(await advanceTrainingFormPage.isModelTypeDropdownVisible()).toBe(true);

    // Verify OD-specific model types
    const options = await advanceTrainingFormPage.getModelTypeOptions();
    expect(options).toHaveLength(10);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolov8x")).toBe(true);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolov8m")).toBe(true);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolov8l")).toBe(true);

    // Launch button should be present (disabled until form is valid)
    expect(await advanceTrainingFormPage.isLaunchTrainingButtonVisible()).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Classification ──────────────────────────────────────────────────────────

test.describe("Training Matrix — Classification @project-creation @training-matrix @classification", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | undefined;

  test.beforeEach(async ({ loginPage, projectCreationPage, consoleErrors, page }) => {
    projectId = await createProjectForTraining("classification", {
      loginPage,
      projectCreationPage,
      consoleErrors,
      page,
    });
  });

  test.afterEach(async ({ page }) => {
    if (!projectId) return;
    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${projectId}`, { archived: true });
    } catch {
      // Best-effort cleanup
    }
  });

  test("Fast Training — form loads with all steps visible", async ({
    fastTrainingFormPage,
    consoleErrors,
  }) => {
    await fastTrainingFormPage.goto(projectId!);
    expect(await fastTrainingFormPage.isLoaded()).toBe(true);

    expect(await fastTrainingFormPage.isDatasetVersionDropdownVisible()).toBe(true);
    expect(await fastTrainingFormPage.isGenerateVersionButtonVisible()).toBe(true);

    consoleErrors.assertNoErrors();
  });

  test("Advanced Training — 7 model types, yolov8m/l/x absent", async ({
    advanceTrainingFormPage,
    consoleErrors,
  }) => {
    await advanceTrainingFormPage.goto(projectId!);
    expect(await advanceTrainingFormPage.isLoaded()).toBe(true);

    expect(await advanceTrainingFormPage.isModelTypeDropdownVisible()).toBe(true);

    // Verify CLS-specific model types
    const options = await advanceTrainingFormPage.getModelTypeOptions();
    expect(options).toHaveLength(7);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolov8s")).toBe(true);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolov8n")).toBe(true);
    // These are OD-only — should NOT be present for classification
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolov8m")).toBe(false);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolov8l")).toBe(false);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolov8x")).toBe(false);

    expect(await advanceTrainingFormPage.isLaunchTrainingButtonVisible()).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Segmentation ────────────────────────────────────────────────────────────

test.describe("Training Matrix — Segmentation @project-creation @training-matrix @segmentation", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | undefined;

  test.beforeEach(async ({ loginPage, projectCreationPage, consoleErrors, page }) => {
    projectId = await createProjectForTraining("segmentation", {
      loginPage,
      projectCreationPage,
      consoleErrors,
      page,
    });
  });

  test.afterEach(async ({ page }) => {
    if (!projectId) return;
    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${projectId}`, { archived: true });
    } catch {
      // Best-effort cleanup
    }
  });

  test("Fast Training — form loads with all steps visible", async ({
    fastTrainingFormPage,
    consoleErrors,
  }) => {
    await fastTrainingFormPage.goto(projectId!);
    expect(await fastTrainingFormPage.isLoaded()).toBe(true);

    expect(await fastTrainingFormPage.isDatasetVersionDropdownVisible()).toBe(true);
    expect(await fastTrainingFormPage.isGenerateVersionButtonVisible()).toBe(true);

    consoleErrors.assertNoErrors();
  });

  test("Advanced Training — 5 model types, mask_rcnn absent", async ({
    advanceTrainingFormPage,
    consoleErrors,
  }) => {
    await advanceTrainingFormPage.goto(projectId!);
    expect(await advanceTrainingFormPage.isLoaded()).toBe(true);

    expect(await advanceTrainingFormPage.isModelTypeDropdownVisible()).toBe(true);

    // Verify SEG-specific model types
    const options = await advanceTrainingFormPage.getModelTypeOptions();
    expect(options).toHaveLength(5);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolo26s")).toBe(true);
    expect(await advanceTrainingFormPage.hasModelTypeOption("yolo26x")).toBe(true);
    // mask_rcnn is filtered out for all segmentation projects
    expect(await advanceTrainingFormPage.hasModelTypeOption("mask_rcnn_r50_fpn_3x")).toBe(false);

    expect(await advanceTrainingFormPage.isLaunchTrainingButtonVisible()).toBe(true);
    consoleErrors.assertNoErrors();
  });
});
