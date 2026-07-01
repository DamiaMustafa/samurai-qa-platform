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
 * Critical Path E2E — SEG V1 + Unlabeled Folder + Grounding DINO
 */
test.describe("Critical Path — SEG V1 Unlabeled Grounding DINO @critical-path @seg", () => {
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

  test("full pipeline: SEG V1 + unlabeled grounding dino → train → deploy", async ({
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
      version: "v1",
      namePrefix: "CP-SEG-V1-UL-GD",
    }, consoleErrors);

    await uploadUnlabeledFolder(page, uploadDatasetPage, {
      folderPath: "road_segmentationv1.1.v4i.coco",
      classNames: ["road"],
    }, consoleErrors);

    await addClassNames(page, ["road"], consoleErrors);
    await handleLabelingMode(page, labelingModeSelectionPage, "grounding-dino", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-seg-v1-gd", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await runGroundingDino(page, projectId, ["road"], consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
