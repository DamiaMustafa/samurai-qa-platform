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
 * Critical Path E2E — OD V2 + Video
 */
test.describe("Critical Path — OD V2 Video @critical-path @od @video", () => {
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

  test("full pipeline: OD V2 + video → train → deploy", async ({
    page,
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    labelingTaskCreationPage,
    fastTrainingFormPage,
    deployPage,
    consoleErrors,
  }) => {
    const classNames = ["car", "motorcycle", "truck", "bus", "taxi"];

    projectId = await createProject(page, projectCreationPage, {
      projectType: "object_detection",
      version: "v2",
      namePrefix: "CP-OD-V2-VID",
    }, consoleErrors);

    await uploadVideo(page, uploadDatasetPage, {
      videoPath: fixturePath("od_video.mp4"),
      classNames,
    }, consoleErrors);

    await addClassNames(page, classNames, consoleErrors);
    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-od-v2-vid", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await runAutoLabelForVideo(page, projectId, consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
