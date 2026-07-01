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
 * Critical Path E2E — CLS V2 + Unlabeled Folder + Grounding DINO
 */
test.describe("Critical Path — CLS V2 Unlabeled Grounding DINO @critical-path @cls", () => {
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

  test("full pipeline: CLS V2 + unlabeled grounding dino → train → deploy", async ({
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
      classificationType: "single-label",
      namePrefix: "CP-CLS-V2-UL-GD",
    }, consoleErrors);

    await uploadUnlabeledFolder(page, uploadDatasetPage, {
      folderPath: "cls_unlabeled",
      classNames: ["cat", "dog"],
    }, consoleErrors);

    await addClassNames(page, ["cat", "dog"], consoleErrors);
    await handleLabelingMode(page, labelingModeSelectionPage, "grounding-dino", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-cls-v2-gd", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await runGroundingDino(page, projectId, ["cat", "dog"], consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
