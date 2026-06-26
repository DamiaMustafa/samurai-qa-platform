/**
 * Workflow Blocks Tests
 *
 * Covers block picker operations and node add/remove functionality.
 *
 * Test Matrix (6 tests):
 *   Block 1: Block Picker @workflow @blocks
 *     1. clicking add-bottom button opens block picker
 *     2. block picker shows available options
 *     3. block picker search filters options
 *   Block 2: Add/Remove Nodes @workflow @blocks
 *     4. adding a node increases node count
 *     5. selecting a node then pressing Delete removes it
 *     6. connection count reflects default connections
 */
import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockWorkflowList,
  mockAllWorkflowAPIs,
} from "../../src/helpers/workflow-helpers";

const mockWorkflows = createMockWorkflowList(1);
const workflowId = mockWorkflows[0].id;

test.describe("Block 1: Block Picker @workflow @blocks", () => {
  test.beforeEach(async ({ loginPage, workflowCanvasPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    await mockAllWorkflowAPIs(page, mockWorkflows);
    await workflowCanvasPage.goto(workflowId);

    const nodeCount = await workflowCanvasPage.getNodeCount();
    test.skip(nodeCount === 0, "Canvas did not load (0 nodes)");
  });

  test("clicking add-bottom button opens block picker", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await workflowCanvasPage.clickAddBottomButton(0);
    await page.waitForTimeout(1000);

    const isVisible = await workflowCanvasPage.isBlockPickerVisible();
    expect(isVisible).toBe(true);

    consoleErrors.assertNoErrors();
  });

  test("block picker shows available options", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await workflowCanvasPage.clickAddBottomButton(0);
    await page.waitForTimeout(1000);

    const optionCount = await workflowCanvasPage.getBlockPickerOptionCount();
    expect(optionCount).toBeGreaterThan(0);

    const optionTexts = await workflowCanvasPage.getBlockPickerOptionTexts();
    expect(optionTexts.length).toBeGreaterThan(0);

    consoleErrors.assertNoErrors();
  });

  test("block picker search filters options", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    await workflowCanvasPage.clickAddBottomButton(0);
    await page.waitForTimeout(1000);

    const initialCount = await workflowCanvasPage.getBlockPickerOptionCount();

    await workflowCanvasPage.fillBlockPickerSearch("detection");
    await page.waitForTimeout(500);

    const filteredCount = await workflowCanvasPage.getBlockPickerOptionCount();
    expect(filteredCount).toBeLessThan(initialCount);

    consoleErrors.assertNoErrors();
  });
});

test.describe("Block 2: Add/Remove Nodes @workflow @blocks", () => {
  test.beforeEach(async ({ loginPage, workflowCanvasPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);

    await mockAllWorkflowAPIs(page, mockWorkflows);
    await workflowCanvasPage.goto(workflowId);

    const nodeCount = await workflowCanvasPage.getNodeCount();
    test.skip(nodeCount === 0, "Canvas did not load (0 nodes)");
  });

  test("adding a node increases node count", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    const initialCount = await workflowCanvasPage.getNodeCount();

    await workflowCanvasPage.clickAddBottomButton(0);
    await page.waitForTimeout(1000);

    // Click the first available option (safest across environments)
    const optionTexts = await workflowCanvasPage.getBlockPickerOptionTexts();
    const firstOption = optionTexts[0];
    await workflowCanvasPage.clickBlockPickerOption(firstOption);
    await page.waitForTimeout(2000);

    const newCount = await workflowCanvasPage.getNodeCount();
    expect(newCount).toBeGreaterThan(initialCount);

    consoleErrors.assertNoErrors();
  });

  test("selecting a node then pressing Delete removes it", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    const initialCount = await workflowCanvasPage.getNodeCount();

    // Click on the middle node (object_detection_model)
    await workflowCanvasPage.clickNode("object_detection_model");
    await page.waitForTimeout(500);

    await page.keyboard.press("Delete");
    await page.waitForTimeout(1000);

    const newCount = await workflowCanvasPage.getNodeCount();
    expect(newCount).toBeLessThan(initialCount);

    consoleErrors.assertNoErrors();
  });

  test("connection count reflects default connections", async ({
    workflowCanvasPage,
    page,
    consoleErrors,
  }) => {
    const connectionCount = await workflowCanvasPage.getConnectionCount();
    expect(connectionCount).toBeGreaterThanOrEqual(2);

    consoleErrors.assertNoErrors();
  });
});