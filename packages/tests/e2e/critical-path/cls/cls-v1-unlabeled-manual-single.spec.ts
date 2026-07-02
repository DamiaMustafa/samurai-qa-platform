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
  waitForTrainingCompletion,
  deployModel,
  cleanupProject,
  sendSlackNotification,
} from "../helpers/pipeline-helpers";

/**
 * Critical Path E2E — CLS V1 + Unlabeled Folder + Manual (Single-Label)
 *
 * Full pipeline (2-phase training):
 *   Sign in → Create CLS V1 project → Upload unlabeled folder →
 *   Add class names → Create labeling task → Auto-label (editor) →
 *   Review → Fast Train Phase 1 (start + verify IN-PROGRESS) →
 *   Fast Train Phase 2 (poll for DONE, up to 6 hours) →
 *   Deploy → Cleanup
 *
 * CLS V1 does not have a classification type selector.
 * Single-label is the default.
 */
const TEST_TITLE = "full pipeline: CLS V1 + unlabeled manual single-label → train → deploy";

test.describe("Critical Path — CLS V1 Unlabeled Manual Single @critical-path @cls", () => {
  test.setTimeout(8 * 60 * 60 * 1000); // 8 hours — training can take 4-6h

  let projectId: string | undefined;
  let projectName: string = "";

  test.skip(!envConfig.credentials.admin.username, "Admin credentials not configured");

  test.beforeEach(async ({ loginPage, page }) => {
    await signIn(page, loginPage);
    projectId = undefined;
    projectName = `E2E-CLS-V1-UL-Manual-Single-${new Date().toISOString().substring(0, 10).replace(/-/g, "-")}-${String(new Date().getHours()).padStart(2, "0")}-${String(new Date().getMinutes()).padStart(2, "0")}`;
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
      version: "v1",
      namePrefix: "E2E-CLS-V1-UL-Manual-Single",
    }, consoleErrors);

    await uploadUnlabeledFolder(page, uploadDatasetPage, {
      folderPath: "cls_unlabeled",
      classNames: ["cat", "dog"],
    }, consoleErrors);

    await addClassNames(page, ["cat", "dog"], consoleErrors);
    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);
    await createLabelingTask(page, labelingTaskCreationPage, "cp-cls-v1-ul", consoleErrors);
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);
    await runAutoLabelFromEditor(page, projectId, consoleErrors);
    await runReview(page, projectId, consoleErrors);

    // Step 8a: Start training (Phase 1 — start + verify IN-PROGRESS)
    const trainingState = await startTraining(page, fastTrainingFormPage, projectId, consoleErrors, {
      trainingNamePrefix: "E2E-FastTrain-CLS-V1-UL-Manual-Single",
    });

    // Step 8b: Wait for training completion (Phase 2 — poll for DONE)
    if (trainingState.phase === "in-progress") {
      await waitForTrainingCompletion(page, trainingState, consoleErrors);
    }

    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
