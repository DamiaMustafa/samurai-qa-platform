import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * WorkflowCanvasPage — Workflow Canvas Editor with foblex flow diagram,
 * sidebar config/output panels, block picker, model selection dialog,
 * and polygon specification dialog.
 *
 * DOM reference (verified against samurai-central-frontend Angular templates):
 *
 * Canvas Editor Page (/workflow/:workflowId):
 * - Root:           <div id="workflow-page">
 * - Main:           <div id="workflow-main">
 * - Canvas:         <div id="workflow-canvas"> or <workflow-canvas>
 * - Save Button:    <button id="workflow-save-button">
 * - Run Button:     <button id="workflow-run-button">
 * - Run Spinner:    <mat-spinner id="workflow-running-spinner">
 *
 * Sidebar:
 * - Sidebar:        <div id="workflow-side" class="workflow__side">
 * - Header:         <div id="workflow-side-header">
 * - Title:          <span id="workflow-side-header-name">
 * - Close:          <button id="workflow-side-close-button">
 * - Config Panel:   <div id="workflow-config" class="workflow__config">
 * - Output Panel:   <div id="workflow-side-output" class="workflow__side-output">
 *
 * Canvas Nodes (foblex):
 * - Flow:           <f-flow class="f-flow">
 * - Nodes:          <workflow-block class="block">
 * - Selected Node:  .f-selected or .block.f-selected
 * - Connections:    <f-connection class="f-connection">
 * - Drag Tooltip:   <div id="workflow-drag-tooltip" class="drag-tooltip">
 *
 * Block (per node):
 * - Root:           #workflow-block-{nodeId} (dynamic)
 * - Add Top:        [id*="workflow-block-add-top"]
 * - Add Bottom:     [id*="workflow-block-add-bottom"]
 * - Content:        .block__content
 * - Name:           .block__detail-name
 *
 * Block Picker (PopupMenu overlay):
 * - Picker:         .popup-menu
 * - Options:        .popup-menu__option
 * - Search:         .popup-menu input, .popup-menu sc-search input
 * - Back:           .popup-menu__back
 *
 * Model Selection Dialog:
 * - Dialog:         <div id="workflow-model-selection-dialog">
 * - Close:          <button id="workflow-model-selection-close">
 * - Your Models:    <button id="workflow-model-selection-tab-your-models">
 * - Model Hub:      <button id="workflow-model-selection-tab-model-hub">
 * - Items:          [id*="workflow-model-item-"]
 * - Hub Items:      [id*="workflow-model-hub-item-"]
 * - Empty Yours:    <div id="workflow-model-selection-empty-your-models">
 * - Empty Hub:      <div id="workflow-model-selection-empty-model-hub">
 * - Apply:          <button id="workflow-model-selection-apply">
 *
 * Polygon Spec Dialog:
 * - Dialog:         <div class="polygon-dialog">
 * - Canvas:         <canvas> inside .polygon-dialog
 * - Image:          <img> inside .polygon-dialog
 * - Retry:          button:has-text("Retry")
 * - Apply:          button:has-text("Apply")
 * - Close:          button:has-text("Got it")
 */
export class WorkflowCanvasPage extends BasePage {
  // ── Canvas Editor Selectors ────────────────────────────────────────────────
  private readonly root = "#workflow-canvas-container, #workflow-page";
  private readonly main = "#workflow-main";
  private readonly canvas = "#workflow-canvas, workflow-canvas";
  private readonly saveButton = "#workflow-save-button";
  private readonly runButton = "#workflow-run-button";
  private readonly runningSpinner = "#workflow-running-spinner, mat-spinner";

  // ── Sidebar Selectors ─────────────────────────────────────────────────────
  private readonly sidebar = "#workflow-side, .workflow__side";
  private readonly sidebarHeader = "#workflow-side-header";
  private readonly sidebarTitle = "#workflow-side-header-name";
  private readonly sidebarClose = "#workflow-side-close-button";
  private readonly configPanel = "#workflow-config, .workflow__config";
  private readonly outputPanel = "#workflow-side-output, .workflow__side-output";

  // ── Canvas Nodes (foblex) Selectors ────────────────────────────────────────
  private readonly foblexFlow = "f-flow, .f-flow";
  private readonly nodes = "workflow-block, .block";
  private readonly selectedNode = ".f-selected, .block.f-selected";
  private readonly connectionLines = "f-connection, .f-connection";
  private readonly dragTooltip = "#workflow-drag-tooltip, .drag-tooltip";

  // ── Block Selectors (per-node dynamic IDs) ────────────────────────────────
  private readonly blockContent = ".block__content";
  private readonly blockName = ".block__detail-name";

  // ── Block Picker Selectors ─────────────────────────────────────────────────
  private readonly blockPicker = ".popup-menu";
  private readonly blockPickerOptions = ".popup-menu__option";
  private readonly blockPickerSearch = ".popup-menu input, .popup-menu sc-search input";
  private readonly blockPickerBack = ".popup-menu__back";

  // ── Model Selection Dialog Selectors ───────────────────────────────────────
  private readonly modelDialog = "#workflow-model-selection-dialog";
  private readonly modelDialogClose = "#workflow-model-selection-close";
  private readonly modelTabYourModels = "#workflow-model-selection-tab-your-models";
  private readonly modelTabModelHub = "#workflow-model-selection-tab-model-hub";
  private readonly modelItems = '[id*="workflow-model-item-"]';
  private readonly modelHubItems = '[id*="workflow-model-hub-item-"]';
  private readonly modelEmptyYourModels = "#workflow-model-selection-empty-your-models";
  private readonly modelEmptyHub = "#workflow-model-selection-empty-model-hub";
  private readonly modelApplyButton = "#workflow-model-selection-apply";

  // ── Polygon Spec Dialog Selectors ──────────────────────────────────────────
  private readonly polygonDialog = ".polygon-dialog";
  private readonly polygonCanvas = ".polygon-dialog canvas";
  private readonly polygonImage = ".polygon-dialog img";
  private readonly polygonRetry = '.polygon-dialog button:has-text("Retry")';
  private readonly polygonApply = '.polygon-dialog button:has-text("Apply")';
  private readonly polygonClose = '.polygon-dialog button:has-text("Got it")';

  constructor(page: Page) {
    super(page);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Navigation
  // ════════════════════════════════════════════════════════════════════════════

  async goto(workflowId: string): Promise<void> {
    await this.navigate(`/workflow/${workflowId}`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Save / Run
  // ════════════════════════════════════════════════════════════════════════════

  async isSaveButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.saveButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickSave(): Promise<void> {
    await this.page.locator(this.saveButton).first().click();
  }

  async isRunButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.runButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickRun(): Promise<void> {
    await this.page.locator(this.runButton).first().click();
  }

  async isRunningSpinnerVisible(): Promise<boolean> {
    return this.page
      .locator(this.runningSpinner)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Canvas
  // ════════════════════════════════════════════════════════════════════════════

  async isCanvasVisible(): Promise<boolean> {
    return this.page
      .locator(this.canvas)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getNodeCount(): Promise<number> {
    await this.page.waitForTimeout(500);
    return this.page.locator(this.nodes).count();
  }

  async isNodeVisible(nodeId: string): Promise<boolean> {
    return this.page
      .locator(`#workflow-block-${nodeId}`)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getNodeName(nodeId: string): Promise<string> {
    const node = this.page.locator(`#workflow-block-${nodeId}`);
    return (
      (await node.locator(this.blockName).first().textContent()) || ""
    ).trim();
  }

  async clickNode(nodeId: string): Promise<void> {
    await this.page.locator(`#workflow-block-${nodeId}`).first().click();
  }

  async getSelectedNode(): Promise<string> {
    const el = this.page.locator(this.selectedNode).first();
    const id = await el.getAttribute("id").catch(() => "");
    if (!id) return "";
    // Extract nodeId from "workflow-block-{nodeId}" pattern
    const match = id.match(/^workflow-block-(.+)$/);
    return match ? match[1] : id;
  }

  async getConnectionCount(): Promise<number> {
    return this.page.locator(this.connectionLines).count();
  }

  async isDragTooltipVisible(): Promise<boolean> {
    return this.page
      .locator(this.dragTooltip)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Sidebar
  // ════════════════════════════════════════════════════════════════════════════

  async isSidebarVisible(): Promise<boolean> {
    return this.page
      .locator(this.sidebar)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getSidebarTitle(): Promise<string> {
    return (
      (await this.page.locator(this.sidebarTitle).first().textContent()) || ""
    ).trim();
  }

  async closeSidebar(): Promise<void> {
    await this.page.locator(this.sidebarClose).first().click();
  }

  async isConfigPanelVisible(): Promise<boolean> {
    return this.page
      .locator(this.configPanel)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isOutputPanelVisible(): Promise<boolean> {
    return this.page
      .locator(this.outputPanel)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Block Picker (PopupMenu)
  // ════════════════════════════════════════════════════════════════════════════

  async clickAddBottomButton(nodeIndex: number): Promise<void> {
    await this.page
      .locator('[id*="workflow-block-add-bottom"]')
      .nth(nodeIndex)
      .click();
  }

  async clickAddTopButton(nodeIndex: number): Promise<void> {
    await this.page
      .locator('[id*="workflow-block-add-top"]')
      .nth(nodeIndex)
      .click();
  }

  async isBlockPickerVisible(): Promise<boolean> {
    return this.page
      .locator(this.blockPicker)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getBlockPickerOptionCount(): Promise<number> {
    return this.page.locator(this.blockPickerOptions).count();
  }

  async getBlockPickerOptionTexts(): Promise<string[]> {
    const els = this.page.locator(this.blockPickerOptions);
    const count = await els.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push(((await els.nth(i).textContent()) || "").trim());
    }
    return texts;
  }

  async clickBlockPickerOption(text: string): Promise<void> {
    await this.page
      .locator(this.blockPickerOptions)
      .filter({ hasText: text })
      .first()
      .click();
  }

  async fillBlockPickerSearch(query: string): Promise<void> {
    const input = this.page.locator(this.blockPickerSearch).first();
    await input.fill(query);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Model Selection Dialog
  // ════════════════════════════════════════════════════════════════════════════

  async isModelDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.modelDialog)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickYourModelsTab(): Promise<void> {
    await this.page.locator(this.modelTabYourModels).first().click();
  }

  async clickModelHubTab(): Promise<void> {
    await this.page.locator(this.modelTabModelHub).first().click();
  }

  async getModelCount(): Promise<number> {
    return this.page.locator(this.modelItems).count();
  }

  async getModelHubCount(): Promise<number> {
    return this.page.locator(this.modelHubItems).count();
  }

  async clickModel(index: number): Promise<void> {
    await this.page.locator(this.modelItems).nth(index).click();
  }

  async clickModelHubItem(index: number): Promise<void> {
    await this.page.locator(this.modelHubItems).nth(index).click();
  }

  async isModelApplyButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.modelApplyButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickModelApply(): Promise<void> {
    await this.page.locator(this.modelApplyButton).first().click();
  }

  async closeModelDialog(): Promise<void> {
    await this.page.locator(this.modelDialogClose).first().click();
  }

  async isEmptyYourModelsVisible(): Promise<boolean> {
    return this.page
      .locator(this.modelEmptyYourModels)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isEmptyModelHubVisible(): Promise<boolean> {
    return this.page
      .locator(this.modelEmptyHub)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Polygon Spec Dialog
  // ════════════════════════════════════════════════════════════════════════════

  async isPolygonDialogVisible(): Promise<boolean> {
    return this.page
      .locator(this.polygonDialog)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isPolygonCanvasVisible(): Promise<boolean> {
    return this.page
      .locator(this.polygonCanvas)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickPolygonCanvas(x: number, y: number): Promise<void> {
    await this.page.locator(this.polygonCanvas).first().click({ position: { x, y } });
  }

  async doubleClickPolygonCanvas(): Promise<void> {
    await this.page.locator(this.polygonCanvas).first().dblclick();
  }

  async clickPolygonRetry(): Promise<void> {
    await this.page.locator(this.polygonRetry).first().click();
  }

  async clickPolygonApply(): Promise<void> {
    await this.page.locator(this.polygonApply).first().click();
  }

  async isPolygonApplyDisabled(): Promise<boolean> {
    const btn = this.page.locator(this.polygonApply).first();
    const disabled = await btn.getAttribute("disabled");
    return disabled !== null;
  }

  async closePolygonDialog(): Promise<void> {
    await this.page.locator(this.polygonClose).first().click();
  }
}