import { test, expect } from "../../../src/fixtures";
import { envConfig } from "../../../src/config/environments";
import {
  signIn,
  createProject,
  uploadUnlabeledFolder,
  addClassNames,
  handleLabelingMode,
  createLabelingTask,
  publishDataset,
  runGroundingDino,
  runReview,
  startTraining,
  deployModel,
  cleanupProject,
} from "../helpers/pipeline-helpers";

/**
 * Critical Path E2E — OD V1 + Unlabeled Folder + Grounding DINO
 *
 * Upload unlabeled images → add class names → select Grounding DINO mode →
 * create labeling task → auto-label via Grounding DINO → review → train → deploy
 */
test.describe("Critical Path — OD V1 Unlabeled Grounding DINO @critical-path @od", () => {
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

  test("full pipeline: OD V1 + unlabeled grounding dino → train → deploy", async ({
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
      projectType: "object_detection",
      version: "v1",
      namePrefix: "CP-OD-V1-UL-GD",
    }, consoleErrors);

    await uploadUnlabeledFolder(page, uploadDatasetPage, {
      folderPath: "od_unlabeled",
      classNames: ["apple", "banana", "grapes"],
    }, consoleErrors);

    await addClassNames(page, ["apple", "banana", "grapes"], consoleErrors);
    await handleLabelingMode(page, labelingModeSelectionPage, "grounding-dino", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-od-v1-gd", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await runGroundingDino(page, projectId, ["apple", "banana", "grapes"], consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
