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
} from "../helpers/pipeline-helpers";
import { assertCheckpoint } from "../helpers/critical-path.helpers";

/**
 * Critical Path E2E — OD V1 + Labeled YOLO
 *
 * Full pipeline (2-phase training):
 *   Sign in → Create OD V1 project → Upload YOLO labeled ZIP →
 *   Create labeling task → Submit (pre-labeled) → Review →
 *   Fast Train Phase 1 (start + verify IN-PROGRESS) →
 *   Fast Train Phase 2 (poll for DONE, up to 6 hours) →
 *   Deploy → Cleanup
 *
 * Training is split into 2 phases because real training takes 4-6 hours.
 * Phase 1 starts training and verifies it reaches IN-PROGRESS status.
 * Phase 2 polls for completion (DONE) with a 6-hour timeout.
 *
 * If Phase 2 times out or is interrupted, it can be re-run independently
 * via training-completion.spec.ts using the saved training state.
 *
 * Real backend, no mocks.
 */
test.describe("Critical Path — OD V1 Labeled YOLO @critical-path @od", () => {
  test.setTimeout(8 * 60 * 60 * 1000); // 8 hours — training can take 4-6h

  let projectId: string | undefined;

  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured"
  );

  test.beforeEach(async ({ loginPage, page }) => {
    await signIn(page, loginPage);
    projectId = undefined;
  });

  test.afterEach(async ({ page }) => {
    if (projectId) {
      await cleanupProject(page, projectId);
    }
  });

  test("full pipeline: OD V1 + YOLO labeled → train → deploy", async ({
    page,
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    labelingTaskCreationPage,
    fastTrainingFormPage,
    deployPage,
    consoleErrors,
  }) => {
    // Step 1-2: Create project
    projectId = await createProject(page, projectCreationPage, {
      projectType: "object_detection",
      version: "v1",
      namePrefix: "CP-OD-V1-YOLO",
    }, consoleErrors);

    // Step 3: Upload labeled YOLO ZIP
    await uploadLabeledZip(page, uploadDatasetPage, {
      zipPath: fixturePath("od_labeled_yolo.zip"),
      format: "yolo",
    }, consoleErrors);

    // Step 4: Handle labeling mode (may appear)
    await handleLabelingMode(page, labelingModeSelectionPage, "manual", consoleErrors);

    // Step 5: Create labeling task
    await createLabelingTask(page, labelingTaskCreationPage, "cp-od-v1-yolo", consoleErrors);

    // Step 6: Publish dataset
    await publishDataset(page, labelingTaskCreationPage, consoleErrors);

    // Step 5 (labeled): Submit pre-labeled task
    await submitPreLabeledTask(page, projectId, consoleErrors);

    // Step 7: Review
    await runReview(page, projectId, consoleErrors);

    // Step 8a: Start training (Phase 1 — start + verify IN-PROGRESS)
    const trainingState = await startTraining(page, fastTrainingFormPage, projectId, consoleErrors);

    // Step 8b: Wait for training completion (Phase 2 — poll for DONE)
    // If training already completed (small dataset), this is a no-op.
    if (trainingState.phase === "in-progress") {
      await waitForTrainingCompletion(page, trainingState, consoleErrors);
    }

    // Step 9: Deploy
    await deployModel(page, deployPage, projectId, consoleErrors);
  });
});
