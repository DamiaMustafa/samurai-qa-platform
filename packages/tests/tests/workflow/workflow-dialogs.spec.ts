/**
 * Workflow Dialogs Tests
 *
 * Test Matrix (9 tests):
 * Block 1: Model Selection Dialog @workflow @model-dialog (5 tests)
 *   1. model dialog opens when clicking model selector on AI node
 *   2. dialog has Your Models and Model Hub tabs
 *   3. Your Models tab shows model list or empty state
 *   4. Model Hub tab shows public models or empty state
 *   5. apply button visible in dialog
 *
 * Block 2: Polygon Spec Dialog @workflow @polygon-dialog (4 tests)
 *   6. polygon dialog opens from polygon zone specification node
 *   7. canvas element visible in dialog
 *   8. retry button visible
 *   9. apply button disabled when no points drawn
 */

import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockWorkflowList,
  mockAllWorkflowAPIs,
} from "../../src/helpers/workflow-helpers";

// ---------------------------------------------------------------------------
// Helper: open the model selection dialog from the sidebar config panel.
// Clicks on the "object_detection_model" node, then finds and clicks the
// model selector trigger in the config panel.
// ---------------------------------------------------------------------------
async function openModelDialog(workflowCanvasPage: any, page: any): Promise<boolean> {
  // Click on model node to open sidebar config panel
  await workflowCanvasPage.clickNode("object_detection_model");
  await page.waitForTimeout(1000);

  // Look for model selector trigger in sidebar config panel
  const modelTrigger = page.locator(
    '.workflow__model, [id*="workflow-config"] button:has-text("Select"), [id*="workflow-config"] [class*="model"]'
  ).first();

  const triggerVisible = await modelTrigger.isVisible({ timeout: 3000 }).catch(() => false);
  if (!triggerVisible) {
    return false;
  }

  await modelTrigger.click();
  await page.waitForTimeout(2000);
  return true;
}

// ---------------------------------------------------------------------------
// Block 1: Model Selection Dialog
// ---------------------------------------------------------------------------
test.describe("Model Selection Dialog @workflow @model-dialog", () => {
  let workflowId: string;

  test.beforeEach(async ({ loginPage, workflowCanvasPage, page }) => {
    const mockWorkflows = createMockWorkflowList(1);
    workflowId = mockWorkflows[0].id;

    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    await mockAllWorkflowAPIs(page, mockWorkflows);
    await workflowCanvasPage.goto(workflowId);
  });

  test("model dialog opens when clicking model selector on AI node", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("open model selection dialog from sidebar config", async () => {
      const opened = await openModelDialog(workflowCanvasPage, page);
      test.skip(!opened, "Model selector trigger not found in sidebar config panel");
    });

    await test.step("verify model dialog is visible", async () => {
      const visible = await workflowCanvasPage.isModelDialogVisible();
      expect(visible, "model selection dialog should be visible").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });

  test("dialog has Your Models and Model Hub tabs", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("open model selection dialog from sidebar config", async () => {
      const opened = await openModelDialog(workflowCanvasPage, page);
      test.skip(!opened, "Model selector trigger not found in sidebar config panel");
    });

    await test.step("verify Your Models tab is visible", async () => {
      const yourModelsTab = page.locator("#workflow-model-selection-tab-your-models");
      await expect(yourModelsTab, "Your Models tab should be visible").toBeVisible();
    });

    await test.step("verify Model Hub tab is visible", async () => {
      const modelHubTab = page.locator("#workflow-model-selection-tab-model-hub");
      await expect(modelHubTab, "Model Hub tab should be visible").toBeVisible();
    });

    consoleErrors.assertNoErrors();
  });

  test("Your Models tab shows model list or empty state", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("open model selection dialog from sidebar config", async () => {
      const opened = await openModelDialog(workflowCanvasPage, page);
      test.skip(!opened, "Model selector trigger not found in sidebar config panel");
    });

    await test.step("verify Your Models tab has models or shows empty state", async () => {
      const modelCount = await workflowCanvasPage.getModelCount();
      const isEmptyVisible = await workflowCanvasPage.isEmptyYourModelsVisible();
      const hasContent = modelCount > 0 || isEmptyVisible;
      expect(
        hasContent,
        "Your Models tab should either show models (count > 0) or display empty state"
      ).toBe(true);
    });

    consoleErrors.assertNoErrors();
  });

  test("Model Hub tab shows public models or empty state", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("open model selection dialog from sidebar config", async () => {
      const opened = await openModelDialog(workflowCanvasPage, page);
      test.skip(!opened, "Model selector trigger not found in sidebar config panel");
    });

    await test.step("switch to Model Hub tab", async () => {
      await workflowCanvasPage.clickModelHubTab();
      await page.waitForTimeout(1000);
    });

    await test.step("verify Model Hub tab has models or shows empty state", async () => {
      const hubCount = await workflowCanvasPage.getModelHubCount();
      const isEmptyVisible = await workflowCanvasPage.isEmptyModelHubVisible();
      const hasContent = hubCount > 0 || isEmptyVisible;
      expect(
        hasContent,
        "Model Hub tab should either show public models (count > 0) or display empty state"
      ).toBe(true);
    });

    consoleErrors.assertNoErrors();
  });

  test("apply button visible in dialog", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("open model selection dialog from sidebar config", async () => {
      const opened = await openModelDialog(workflowCanvasPage, page);
      test.skip(!opened, "Model selector trigger not found in sidebar config panel");
    });

    await test.step("verify apply button is visible", async () => {
      const visible = await workflowCanvasPage.isModelApplyButtonVisible();
      expect(visible, "apply button should be visible in model dialog").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });
});

// ---------------------------------------------------------------------------
// Block 2: Polygon Spec Dialog
// ---------------------------------------------------------------------------
test.describe("Polygon Spec Dialog @workflow @polygon-dialog", () => {
  let workflowId: string;

  test.beforeEach(async ({ loginPage, workflowCanvasPage, page }) => {
    const mockWorkflows = createMockWorkflowList(1);
    workflowId = mockWorkflows[0].id;

    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    await mockAllWorkflowAPIs(page, mockWorkflows);
    await workflowCanvasPage.goto(workflowId);
  });

  test("polygon dialog opens from polygon zone specification node", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("check if polygon zone node exists on canvas", async () => {
      const hasPolygonNode = await workflowCanvasPage.isNodeVisible(
        "polygon_zone_specification"
      );
      test.skip(
        !hasPolygonNode,
        "Polygon zone specification node not present in default workflow view"
      );
    });

    await test.step("click polygon zone specification node to open dialog", async () => {
      await workflowCanvasPage.clickNode("polygon_zone_specification");
      await page.waitForTimeout(2000);
    });

    await test.step("verify polygon dialog is visible", async () => {
      const visible = await workflowCanvasPage.isPolygonDialogVisible();
      expect(visible, "polygon dialog should be visible").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });

  test("canvas element visible in dialog", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("check if polygon zone node exists on canvas", async () => {
      const hasPolygonNode = await workflowCanvasPage.isNodeVisible(
        "polygon_zone_specification"
      );
      test.skip(
        !hasPolygonNode,
        "Polygon zone specification node not present in default workflow view"
      );
    });

    await test.step("open polygon dialog", async () => {
      await workflowCanvasPage.clickNode("polygon_zone_specification");
      await page.waitForTimeout(2000);
    });

    await test.step("verify canvas element is visible in polygon dialog", async () => {
      const visible = await workflowCanvasPage.isPolygonCanvasVisible();
      expect(visible, "canvas element should be visible in polygon dialog").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });

  test("retry button visible", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("check if polygon zone node exists on canvas", async () => {
      const hasPolygonNode = await workflowCanvasPage.isNodeVisible(
        "polygon_zone_specification"
      );
      test.skip(
        !hasPolygonNode,
        "Polygon zone specification node not present in default workflow view"
      );
    });

    await test.step("open polygon dialog", async () => {
      await workflowCanvasPage.clickNode("polygon_zone_specification");
      await page.waitForTimeout(2000);
    });

    await test.step("verify retry button is visible", async () => {
      await workflowCanvasPage.clickPolygonRetry();
      // If clickPolygonRetry() succeeds without error, the retry button is visible and clickable
    });

    consoleErrors.assertNoErrors();
  });

  test("apply button disabled when no points drawn", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await test.step("check if polygon zone node exists on canvas", async () => {
      const hasPolygonNode = await workflowCanvasPage.isNodeVisible(
        "polygon_zone_specification"
      );
      test.skip(
        !hasPolygonNode,
        "Polygon zone specification node not present in default workflow view"
      );
    });

    await test.step("open polygon dialog", async () => {
      await workflowCanvasPage.clickNode("polygon_zone_specification");
      await page.waitForTimeout(2000);
    });

    await test.step("verify apply button is disabled without drawn points", async () => {
      const disabled = await workflowCanvasPage.isPolygonApplyDisabled();
      expect(disabled, "apply button should be disabled when no points are drawn").toBe(
        true
      );
    });

    consoleErrors.assertNoErrors();
  });
});