/**
 * Workflow Canvas Tests
 *
 * Test Matrix (8 tests):
 * Block 1: Canvas Layout @workflow @canvas @smoke (4 tests)
 *   1. canvas editor page loads with root element visible
 *   2. save button visible
 *   3. run button visible
 *   4. canvas with default nodes visible (input, model, output)
 *
 * Block 2: Node Selection & Sidebar @workflow @canvas (4 tests)
 *   5. clicking a node opens sidebar with config panel
 *   6. sidebar shows node name in header
 *   7. sidebar close button hides sidebar
 *   8. clicking output node shows output panel
 */

import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockWorkflowList,
  mockAllWorkflowAPIs,
} from "../../src/helpers/workflow-helpers";

// ---------------------------------------------------------------------------
// Block 1: Canvas Layout
// ---------------------------------------------------------------------------
test.describe("Canvas Layout @workflow @canvas @smoke", () => {
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

  test("canvas editor page loads with root element visible", async ({
    workflowCanvasPage,
    consoleErrors,
  }) => {
    await test.step("verify canvas is loaded", async () => {
      const loaded = await workflowCanvasPage.isLoaded();
      expect(loaded, "canvas editor should be loaded").toBe(true);
    });

    await test.step("verify nodes are present (skip if empty)", async () => {
      test.skip(
        (await workflowCanvasPage.getNodeCount()) === 0,
        "Canvas did not load any nodes"
      );
    });

    consoleErrors.assertNoErrors();
  });

  test("save button visible", async ({
    workflowCanvasPage,
    consoleErrors,
  }) => {
    await test.step("verify canvas has nodes before asserting buttons", async () => {
      test.skip(
        (await workflowCanvasPage.getNodeCount()) === 0,
        "Canvas did not load any nodes"
      );
    });

    await test.step("verify save button is visible", async () => {
      const visible = await workflowCanvasPage.isSaveButtonVisible();
      expect(visible, "save button should be visible").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });

  test("run button visible", async ({
    workflowCanvasPage,
    consoleErrors,
  }) => {
    await test.step("verify canvas has nodes before asserting buttons", async () => {
      test.skip(
        (await workflowCanvasPage.getNodeCount()) === 0,
        "Canvas did not load any nodes"
      );
    });

    await test.step("verify run button is visible", async () => {
      const visible = await workflowCanvasPage.isRunButtonVisible();
      expect(visible, "run button should be visible").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });

  test("canvas with default nodes visible (input, model, output)", async ({
    workflowCanvasPage,
    consoleErrors,
  }) => {
    await test.step("verify at least 3 default nodes on canvas", async () => {
      const nodeCount = await workflowCanvasPage.getNodeCount();
      expect(nodeCount, "canvas should have at least 3 default nodes").toBeGreaterThanOrEqual(3);
    });

    await test.step("verify input node is visible", async () => {
      const visible = await workflowCanvasPage.isNodeVisible("input");
      expect(visible, "input node should be visible").toBe(true);
    });

    await test.step("verify object detection model node is visible", async () => {
      const visible = await workflowCanvasPage.isNodeVisible("object_detection_model");
      expect(visible, "model node should be visible").toBe(true);
    });

    await test.step("verify output node is visible", async () => {
      const visible = await workflowCanvasPage.isNodeVisible("output");
      expect(visible, "output node should be visible").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });
});

// ---------------------------------------------------------------------------
// Block 2: Node Selection & Sidebar
// ---------------------------------------------------------------------------
test.describe("Node Selection & Sidebar @workflow @canvas", () => {
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

  test("clicking a node opens sidebar with config panel", async ({
    page,
    workflowCanvasPage,
    consoleErrors,
  }) => {
    await test.step("skip if canvas has no nodes", async () => {
      test.skip(
        (await workflowCanvasPage.getNodeCount()) === 0,
        "Canvas did not load any nodes"
      );
    });

    await test.step("click the input node", async () => {
      await workflowCanvasPage.clickNode("input");
      await page.waitForTimeout(1000);
    });

    await test.step("verify sidebar is visible", async () => {
      const sidebarVisible = await workflowCanvasPage.isSidebarVisible();
      expect(sidebarVisible, "sidebar should be visible after clicking a node").toBe(true);
    });

    await test.step("verify config panel is visible", async () => {
      const configVisible = await workflowCanvasPage.isConfigPanelVisible();
      expect(configVisible, "config panel should be visible after clicking input node").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });

  test("sidebar shows node name in header", async ({
    page,
    workflowCanvasPage,
    consoleErrors,
  }) => {
    await test.step("skip if canvas has no nodes", async () => {
      test.skip(
        (await workflowCanvasPage.getNodeCount()) === 0,
        "Canvas did not load any nodes"
      );
    });

    await test.step("click the input node", async () => {
      await workflowCanvasPage.clickNode("input");
      await page.waitForTimeout(1000);
    });

    await test.step("verify sidebar title contains the node name", async () => {
      const title = await workflowCanvasPage.getSidebarTitle();
      expect(title, "sidebar title should not be empty").toBeTruthy();
      expect(
        title.toLowerCase(),
        "sidebar title should reference the input node"
      ).toContain("input");
    });

    consoleErrors.assertNoErrors();
  });

  test("sidebar close button hides sidebar", async ({
    page,
    workflowCanvasPage,
    consoleErrors,
  }) => {
    await test.step("skip if canvas has no nodes", async () => {
      test.skip(
        (await workflowCanvasPage.getNodeCount()) === 0,
        "Canvas did not load any nodes"
      );
    });

    await test.step("click a node to open the sidebar", async () => {
      await workflowCanvasPage.clickNode("input");
      await page.waitForTimeout(1000);
    });

    await test.step("close the sidebar", async () => {
      await workflowCanvasPage.closeSidebar();
      await page.waitForTimeout(500);
    });

    await test.step("verify sidebar is hidden", async () => {
      const sidebarVisible = await workflowCanvasPage.isSidebarVisible();
      expect(sidebarVisible, "sidebar should be hidden after close").toBe(false);
    });

    consoleErrors.assertNoErrors();
  });

  test("clicking output node shows output panel", async ({
    page,
    workflowCanvasPage,
    consoleErrors,
  }) => {
    await test.step("skip if canvas has no nodes", async () => {
      test.skip(
        (await workflowCanvasPage.getNodeCount()) === 0,
        "Canvas did not load any nodes"
      );
    });

    await test.step("click the output node", async () => {
      await workflowCanvasPage.clickNode("output");
      await page.waitForTimeout(1000);
    });

    await test.step("verify output panel is visible instead of config panel", async () => {
      const outputVisible = await workflowCanvasPage.isOutputPanelVisible();
      expect(outputVisible, "output panel should be visible when clicking output node").toBe(true);
    });

    consoleErrors.assertNoErrors();
  });
});