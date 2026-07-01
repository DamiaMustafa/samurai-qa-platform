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
 * Critical Path E2E — OD V1 + Video
 *
 * Upload video → extract frames → add class names →
 * create labeling task → auto-label frames → review → train → deploy
 *
 * Video classes: car, motorcycle, truck, bus, taxi
 */
test.describe("Critical Path — OD V1 Video @critical-path @od @video", () => {
  test.setTimeout(90 * 60 * 1000); // 90 min — video processing is slow

  let projectId: string | undefined;

  test.skip(!envConfig.credentials.admin.username, "Admin credentials not configured");

  test.beforeEach(async ({ loginPage, page }) => {
    await signIn(page, loginPage);
    projectId = undefined;
  });

  test.afterEach(async ({ page }) => {
    if (projectId) await cleanupProject(page, projectId);
  });

  test("full pipeline: OD V1 + video → train → deploy", async ({
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
      version: "v1",
      namePrefix: "CP-OD-V1-VID",
    }, consoleErrors);

    await uploadVideo(page, uploadDatasetPage, {
      videoPath: fixturePath("od_video.mp4"),
      classNames,
    }, consoleErrors);

    await addClassNames(page, classNames, consoleErrors);
    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-od-v1-vid", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await runAutoLabelForVideo(page, projectId, consoleErrors);
    await runReview(page, projectId, consoleErrors);
    await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
