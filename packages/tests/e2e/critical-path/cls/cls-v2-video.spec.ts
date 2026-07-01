import { test, expect } from "../../../src/fixtures";
import { envConfig } from "../../../src/config/environments";
import {
  signIn,
  createProject,
  uploadVideo,
  addClassNames,
  handleLabelingMode,
  createLabelingTask,
  publishDataset,
  runAutoLabelForVideo,
  runReview,
  startTraining,
  deployModel,
  cleanupProject,
  fixturePath,
} from "../helpers/pipeline-helpers";

/**
 * Critical Path E2E — CLS V2 + Video
 *
 * Video classes: white_vehicle, black_vehicle
 * CLS V2 with single-label classification.
 */
test.describe("Critical Path — CLS V2 Video @critical-path @cls @video", () => {
  test.setTimeout(90 * 60 * 1000);

  let projectId: string | undefined;

  test.skip(!envConfig.credentials.admin.username, "Admin credentials not configured");

  test.beforeEach(async ({ loginPage, page }) => {
    await signIn(page, loginPage);
    projectId = undefined;
  });

  test.afterEach(async ({ page }) => {
    if (projectId) await cleanupProject(page, projectId);
  });

  test("full pipeline: CLS V2 + video → train → deploy", async ({
    page,
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    labelingTaskCreationPage,
    fastTrainingFormPage,
    deployPage,
    consoleErrors,
  }) => {
    const classNames = ["white_vehicle", "black_vehicle"];

    projectId = await createProject(page, projectCreationPage, {
      projectType: "classification",
      version: "v2",
      classificationType: "single-label",
      namePrefix: "CP-CLS-V2-VID",
    }, consoleErrors);

    await uploadVideo(page, uploadDatasetPage, {
      videoPath: fixturePath("cls_video.mp4"),
      classNames,
    }, consoleErrors);

    await addClassNames(page, classNames, consoleErrors);
    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-cls-v2-vid", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await runAutoLabelForVideo(page, projectId, consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
