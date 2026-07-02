import { test, expect } from "../../../src/fixtures";
import { envConfig } from "../../../src/config/environments";
import {
  signIn,
  waitForTrainingCompletion,
  deployModel,
  cleanupProject,
  loadTrainingState,
  sendSlackNotification,
} from "../helpers/pipeline-helpers";
import { LoginPage } from "../../../src/pages/LoginPage";

/**
 * Training Completion — Phase 2 (standalone)
 *
 * This spec picks up where Phase 1 (startTraining) left off.
 * It reads the training state from test-results/training-state.json,
 * polls for training completion (DONE), then deploys the model.
 *
 * Use this when:
 *   - Phase 1 was run in a previous test execution
 *   - Training was interrupted or timed out
 *   - You want to check on training progress without re-running the full pipeline
 *
 * Prerequisites:
 *   - test-results/training-state.json must exist (created by Phase 1)
 *   - The training must have been started via the full pipeline test
 *
 * Real backend, no mocks.
 */
const TEST_TITLE = "wait for training completion and deploy";

test.describe("Training Completion — Phase 2 @critical-path @training-phase2", () => {
  test.setTimeout(7 * 60 * 60 * 1000); // 7 hours for long training

  let projectName: string = "";

  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured"
  );

  test(TEST_TITLE, async ({
    page,
    loginPage,
    deployPage,
    consoleErrors,
  }) => {
    // Load training state from Phase 1
    const state = loadTrainingState();
    if (!state) {
      test.skip(true, "No training state found — run Phase 1 first (full pipeline test)");
      return;
    }

    projectName = `Phase2-${state.projectId}`;
    await sendSlackNotification(TEST_TITLE, projectName, "started");

    try {
      if (state.phase === "done") {
        // Already completed — just deploy
        console.log(`Training already done for project ${state.projectId}`);
      } else if (state.phase === "failed") {
        throw new Error(
          `Training previously failed for project ${state.projectId}. ` +
            `Delete test-results/training-state.json and re-run Phase 1.`
        );
      } else {
        // Phase 1 started training — authenticate and poll for completion
        await signIn(page, loginPage);

        const updatedState = await waitForTrainingCompletion(
          page,
          state,
          consoleErrors
        );

        expect(updatedState.phase).toBe("done");
      }

      // Deploy the trained model
      // Re-authenticate since training wait may have taken hours
      const freshLoginPage = new LoginPage(page);
      await freshLoginPage.loginAs("admin");
      await page.waitForLoadState("networkidle");

      await deployModel(page, deployPage, state.projectId, consoleErrors);

      await sendSlackNotification(TEST_TITLE, projectName, "passed");

      // Cleanup
      await cleanupProject(page, state.projectId);
    } catch (error: any) {
      await sendSlackNotification(
        TEST_TITLE,
        projectName,
        "failed",
        error?.message || "Unknown error"
      );
      throw error;
    }
  });
});
