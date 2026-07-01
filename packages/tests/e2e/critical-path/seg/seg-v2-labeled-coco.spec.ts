import { test, expect } from "../../../src/fixtures";
import { envConfig } from "../../../src/config/environments";
import {
  signIn,
  createProject,
  uploadLabeledZip,
  handleLabelingMode,
  createLabelingTask,
  publishDataset,
  submitPreLabeledTask,
  runReview,
  startTraining,
  deployModel,
  cleanupProject,
  fixturePath,
} from "../helpers/pipeline-helpers";

/**
 * Critical Path E2E — SEG V2 + Labeled COCO
 *
 * Segmentation only supports COCO format.
 */
test.describe("Critical Path — SEG V2 Labeled COCO @critical-path @seg", () => {
  test.setTimeout(60 * 60 * 1000);

  let projectId: string | undefined;

  test.skip(!envConfig.credentials.admin.username, "Admin credentials not configured");

  test.beforeEach(async ({ loginPage, page }) => {
    await signIn(page, loginPage);
    projectId = undefined;
  });

  test.afterEach(async ({ page }) => {
    if (projectId) await cleanupProject(page, projectId);
  });

  test("full pipeline: SEG V2 + COCO labeled → train → deploy", async ({
    page,
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    labelingTaskCreationPage,
    fastTrainingFormPage,
    deployPage,
    consoleErrors,
  }) => {
    projectId = await createProject(page, projectCreationPage, {
      projectType: "segmentation",
      version: "v2",
      namePrefix: "CP-SEG-V2-COCO",
    }, consoleErrors);

    await uploadLabeledZip(page, uploadDatasetPage, {
      zipPath: fixturePath("seg_labeled.zip"),
      format: "coco",
    }, consoleErrors);

    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-seg-v2-coco", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await submitPreLabeledTask(page, projectId, consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
