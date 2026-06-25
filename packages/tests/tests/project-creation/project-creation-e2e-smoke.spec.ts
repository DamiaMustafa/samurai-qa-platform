import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import { timestamp } from "../../src/helpers/data-generator";
import { createCocoZip, createYoloZip } from "../../src/helpers/test-dataset-factory";
import { createApiHelper } from "../../src/helpers/api-helper";

/**
 * Project Creation E2E — Smoke Tests @smoke
 *
 * Verifies the full project creation pipeline for each project type:
 *   Login → Create Project → Upload Dataset → (Labeling Mode) →
 *   Create Task → Publish → Training Page
 *
 * Smoke matrix:
 *   1. Object Detection  V2  Labelled YOLO ZIP  → Fast Training page
 *   2. Classification     V2  Labelled COCO ZIP  → Fast Training page
 *   3. Segmentation       V2  Labelled COCO ZIP  → Fast Training page
 *
 * Long-running backend operations (auto-labeling, model training) are NOT
 * part of these smoke tests. The tests verify that the user reaches the
 * correct page after each step in the pipeline.
 *
 * Cleanup: each created project is archived via API in afterEach.
 */

const RUN_TAG = `smoke-${timestamp()}`;

// ─── Pipeline Config ─────────────────────────────────────────────────────────

type ProjectType = "object_detection" | "classification" | "segmentation";
type LabelFormat = "yolo" | "coco";

interface PipelineConfig {
  projectType: ProjectType;
  labelFormat: LabelFormat;
  classNames: string[];
  taskPrefix: string;
}

// ─── Shared Pipeline Helper ──────────────────────────────────────────────────

/**
 * Run the full project creation pipeline for a given configuration.
 *
 * Steps:
 *   1. Navigate to project creation page
 *   2. Select project type, fill name, submit form
 *   3. Click "Upload Dataset Now" in success dialog
 *   4. Upload labelled dataset (COCO or YOLO ZIP)
 *   5. Wait for client-side validation to complete
 *   6. Submit upload
 *   7. Select labeling mode if applicable (manual)
 *   8. Create labeling task
 *   9. Publish dataset
 *  10. Assert training page is reached
 *
 * Console errors are asserted after every major interaction.
 *
 * @returns projectId extracted from the final URL for cleanup
 */
async function runPipeline(
  config: PipelineConfig,
  fixtures: {
    projectCreationPage: any;
    uploadDatasetPage: any;
    labelingModeSelectionPage: any;
    labelingTaskCreationPage: any;
    trainPage: any;
    consoleErrors: any;
    page: any;
  }
): Promise<string> {
  const {
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    labelingTaskCreationPage,
    trainPage,
    consoleErrors,
    page,
  } = fixtures;

  const projectName = `E2E ${config.projectType} V2 | ${RUN_TAG}`;

  // ── Step 1: Create Project ────────────────────────────────────────────

  await projectCreationPage.goto();
  expect(await projectCreationPage.isLoaded()).toBe(true);

  await projectCreationPage.selectType(config.projectType);
  expect(await projectCreationPage.isTypeSelected(config.projectType)).toBe(true);
  consoleErrors.assertNoErrors();

  // V2 is the default — no need to call selectVersion()
  await projectCreationPage.fillName(projectName);
  expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

  await projectCreationPage.clickSubmit();
  expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
  consoleErrors.assertNoErrors();

  // ── Step 2: Upload Dataset ────────────────────────────────────────────

  await projectCreationPage.clickUploadDatasetNow();
  await expect(page).toHaveURL(/\/dataset\/.+\/add/, { timeout: 15_000 });
  consoleErrors.assertNoErrors();

  // Generate the appropriate test ZIP in memory
  const zipBuffer =
    config.labelFormat === "coco"
      ? await createCocoZip(config.classNames)
      : await createYoloZip(config.classNames);

  await uploadDatasetPage.waitForReady();
  await uploadDatasetPage.selectDatasetType("labelled");
  await uploadDatasetPage.selectLabelFormat(config.labelFormat);
  await uploadDatasetPage.uploadZipFile(zipBuffer);
  await uploadDatasetPage.waitForValidationComplete();
  await uploadDatasetPage.clickUploadDataset();
  consoleErrors.assertNoErrors();

  // ── Step 3: Labeling Mode (appears for unlabelled datasets) ───────────

  // For labelled datasets the labeling mode page may be skipped.
  // Check if we land on it; if so, select manual and continue.
  const isLabelingMode = await labelingModeSelectionPage
    .isLoaded()
    .catch(() => false);
  if (isLabelingMode) {
    await labelingModeSelectionPage.selectMode("manual");
    await labelingModeSelectionPage.clickNext();
    consoleErrors.assertNoErrors();
  }

  // ── Step 4: Create Labeling Task ──────────────────────────────────────

  await labelingTaskCreationPage.waitForReady();
  expect(await labelingTaskCreationPage.isLoaded()).toBe(true);

  await labelingTaskCreationPage.fillTaskPrefix(config.taskPrefix);
  await labelingTaskCreationPage.clickCreate();
  await labelingTaskCreationPage.waitForSubmissionSuccess();
  consoleErrors.assertNoErrors();

  // ── Step 5: Publish Dataset ───────────────────────────────────────────

  await labelingTaskCreationPage.clickPublishDataset();

  // ── Step 6: Verify Training Page ──────────────────────────────────────

  await expect(page).toHaveURL(/\/project\/.+\/train/, { timeout: 30_000 });
  expect(await trainPage.isLoaded()).toBe(true);
  expect(await trainPage.isFastTrainingButtonVisible()).toBe(true);
  consoleErrors.assertNoErrors();

  // Extract project ID from URL for cleanup
  const url: string = page.url();
  const match = url.match(/\/project\/([^/]+)\//);
  return match ? match[1] : "";
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Project Creation E2E — Smoke @smoke @project-creation-e2e", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  // Extend timeout for the full E2E pipeline (upload + server-side validation)
  test.setTimeout(300_000); // 5 min per test

  let createdProjectId: string | undefined;

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    createdProjectId = undefined;
  });

  test.afterEach(async ({ page }) => {
    if (!createdProjectId) return;

    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${createdProjectId}`, { archived: true });
    } catch {
      // Best-effort cleanup — don't fail the test if archiving fails
    }
  });

  // ─── Smoke 1: Object Detection V2 + Labelled YOLO ──────────────────────

  test("Object Detection V2 — labelled YOLO ZIP → training page", async ({
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    labelingTaskCreationPage,
    trainPage,
    consoleErrors,
    page,
  }) => {
    createdProjectId = await runPipeline(
      {
        projectType: "object_detection",
        labelFormat: "yolo",
        classNames: ["apple", "banana"],
        taskPrefix: "smoke-od",
      },
      {
        projectCreationPage,
        uploadDatasetPage,
        labelingModeSelectionPage,
        labelingTaskCreationPage,
        trainPage,
        consoleErrors,
        page,
      }
    );

    expect(createdProjectId).toBeTruthy();
  });

  // ─── Smoke 2: Classification V2 + Labelled COCO ────────────────────────

  test("Classification V2 — labelled COCO ZIP → training page", async ({
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    labelingTaskCreationPage,
    trainPage,
    consoleErrors,
    page,
  }) => {
    createdProjectId = await runPipeline(
      {
        projectType: "classification",
        labelFormat: "coco",
        classNames: ["cat", "dog"],
        taskPrefix: "smoke-cls",
      },
      {
        projectCreationPage,
        uploadDatasetPage,
        labelingModeSelectionPage,
        labelingTaskCreationPage,
        trainPage,
        consoleErrors,
        page,
      }
    );

    expect(createdProjectId).toBeTruthy();
  });

  // ─── Smoke 3: Segmentation V2 + Labelled COCO ──────────────────────────

  test("Segmentation V2 — labelled COCO ZIP → training page", async ({
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    labelingTaskCreationPage,
    trainPage,
    consoleErrors,
    page,
  }) => {
    createdProjectId = await runPipeline(
      {
        projectType: "segmentation",
        labelFormat: "coco",
        classNames: ["car", "truck"],
        taskPrefix: "smoke-seg",
      },
      {
        projectCreationPage,
        uploadDatasetPage,
        labelingModeSelectionPage,
        labelingTaskCreationPage,
        trainPage,
        consoleErrors,
        page,
      }
    );

    expect(createdProjectId).toBeTruthy();
  });
});
