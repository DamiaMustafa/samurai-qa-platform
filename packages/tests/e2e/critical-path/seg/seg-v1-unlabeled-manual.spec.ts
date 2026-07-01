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
  runAutoLabelFromEditor,
  runReview,
  startTraining,
  deployModel,
  cleanupProject,
} from "../helpers/pipeline-helpers";

/**
 * Critical Path E2E — SEG V1 + Unlabeled Folder + Manual Auto-Label
 *
 * Uses the road_segmentationv1.1.v4i.coco folder as unlabeled seg data.
 * Class: road
 */
test.describe("Critical Path — SEG V1 Unlabeled Manual @critical-path @seg", () => {
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

  test("full pipeline: SEG V1 + unlabeled manual → train → deploy", async ({
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
      namePrefix: "CP-SEG-V1-UL-M",
    }, consoleErrors);

    await uploadUnlabeledFolder(page, uploadDatasetPage, {
      folderPath: "road_segmentationv1.1.v4i.coco",
      classNames: ["road"],
    }, consoleErrors);

    await addClassNames(page, ["road"], consoleErrors);
    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-seg-v1-ul", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await runAutoLabelFromEditor(page, projectId, consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
