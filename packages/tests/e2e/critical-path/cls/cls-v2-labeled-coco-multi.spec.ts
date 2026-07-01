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
 * Critical Path E2E — CLS V2 + Labeled COCO Multi-Label
 */
test.describe("Critical Path — CLS V2 Labeled COCO Multi @critical-path @cls", () => {
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

  test("full pipeline: CLS V2 + COCO multi-label → train → deploy", async ({
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
      projectType: "classification",
      version: "v2",
      classificationType: "multi-label",
      namePrefix: "CP-CLS-V2-COCO-M",
    }, consoleErrors);

    await uploadLabeledZip(page, uploadDatasetPage, {
      zipPath: fixturePath("cls_labeled_coco_multi.zip"),
      format: "coco",
    }, consoleErrors);

    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-cls-v2-cm", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await submitPreLabeledTask(page, projectId, consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
