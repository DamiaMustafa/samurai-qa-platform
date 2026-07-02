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
  waitForTrainingCompletion,
  deployModel,
  cleanupProject,
  fixturePath,
  sendSlackNotification,
} from "../helpers/pipeline-helpers";

/**
 * Critical Path E2E — CLS V2 + Labeled YOLO Single-Label
 *
 * Full pipeline (2-phase training):
 *   Sign in → Create CLS V2 project → Upload YOLO labeled ZIP →
 *   Create labeling task → Submit (pre-labeled) → Review →
 *   Fast Train Phase 1 (start + verify IN-PROGRESS) →
 *   Fast Train Phase 2 (poll for DONE, up to 6 hours) →
 *   Deploy → Cleanup
 */
const TEST_TITLE = "full pipeline: CLS V2 + YOLO single-label → train → deploy";

test.describe("Critical Path — CLS V2 Labeled YOLO Single @critical-path @cls", () => {
  test.setTimeout(8 * 60 * 60 * 1000); // 8 hours — training can take 4-6h

  let projectId: string | undefined;
  let projectName: string = "";

  test.skip(!envConfig.credentials.admin.username, "Admin credentials not configured");

  test.beforeEach(async ({ loginPage, page }) => {
    await signIn(page, loginPage);
    projectId = undefined;
    projectName = `E2E-CLS-V2-YOLO-Labeled-Single-${new Date().toISOString().substring(0, 10)}-${String(new Date().getHours()).padStart(2, "0")}-${String(new Date().getMinutes()).padStart(2, "0")}`;
    await sendSlackNotification(TEST_TITLE, projectName, "started");
  });

  test.afterEach(async ({ page }, testInfo) => {
    const status = testInfo.status === "failed" ? "failed" : "passed";
    await sendSlackNotification(
      TEST_TITLE,
      projectName,
      status,
      status === "failed" ? testInfo.errors?.[0]?.message : undefined
    );
    if (projectId) await cleanupProject(page, projectId);
  });

  test(TEST_TITLE, async ({
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
      namePrefix: "E2E-CLS-V2-YOLO-Labeled-Single",
    }, consoleErrors);

    await uploadLabeledZip(page, uploadDatasetPage, {
      zipPath: fixturePath("cls_labeled_yolo_single.zip"),
      format: "yolo",
    }, consoleErrors);

    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-cls-v2-ys", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await submitPreLabeledTask(page, projectId, consoleErrors);
    await runReview(page, projectId, consoleErrors);

    // Step 8a: Start training (Phase 1 — start + verify IN-PROGRESS)
    const trainingState = await startTraining(page, fastTrainingFormPage, projectId, consoleErrors, {
      trainingNamePrefix: "E2E-FastTrain-CLS-V2-YOLO-Single",
    });

    // Step 8b: Wait for training completion (Phase 2 — poll for DONE)
    if (trainingState.phase === "in-progress") {
      await waitForTrainingCompletion(page, trainingState, consoleErrors);
    }

    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
