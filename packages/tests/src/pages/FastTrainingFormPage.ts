import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * FastTrainingFormPage — fast training form at /project/:id/train/fast-training.
 *
 * DOM reference (verified against Angular template):
 * - Root:              <div id="fast-training-page" class="fast-training">
 * - Title:             <div id="fast-training-title">
 * - Dataset version:   <sc-dropdown id="fast-training-dataset-version">
 * - Generate version:  <button id="fast-training-generate-version">
 * - Gen spinner:       <mat-spinner id="fast-training-generate-version-spinner">
 * - Model name:        <sc-input id="fast-training-model-name">
 * - Model name error:  element id="fast-training-model-name-error"
 * - Description:       <sc-textarea id="fast-training-model-description">
 * - Start button:      <button id="fast-training-start">
 * - Start spinner:     <mat-spinner id="fast-training-start-spinner">
 *
 * sc-dropdown wraps <mat-select>. sc-input wraps <mat-form-field>.
 */
export class FastTrainingFormPage extends BasePage {
  private readonly root = "#fast-training-page";
  private readonly title = "#fast-training-title";

  // Step 1: Dataset snapshot
  private readonly datasetVersionDropdown = "#fast-training-dataset-version";
  private readonly generateVersionButton = "#fast-training-generate-version";
  private readonly generateSpinner = "#fast-training-generate-version-spinner";

  // Step 2: Model name
  private readonly modelNameInput = "#fast-training-model-name";
  private readonly modelNameError = "#fast-training-model-name-error";

  // Step 3: Description
  private readonly modelDescriptionInput = "#fast-training-model-description";

  // Actions
  private readonly startButton = "#fast-training-start";
  private readonly startSpinner = "#fast-training-start-spinner";

  constructor(page: Page) {
    super(page);
  }

  // ── Page Load ───────────────────────────────────────────────────────────

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/train/fast-training`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
  }

  async waitForReady(): Promise<void> {
    await this.page
      .locator(this.root)
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
  }

  // ── Step 1: Dataset Snapshot ────────────────────────────────────────────

  /**
   * Click "Generate New Version" to create a dataset snapshot.
   * Waits for the spinner to disappear after clicking.
   */
  async clickGenerateVersion(): Promise<void> {
    await this.page.locator(this.generateVersionButton).first().click();
    // Wait for spinner to appear then disappear
    const spinner = this.page.locator(this.generateSpinner).first();
    if (await spinner.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await spinner.waitFor({ state: "hidden", timeout: 60_000 });
    }
  }

  /**
   * Select the first available dataset snapshot from the dropdown.
   */
  async selectFirstDatasetVersion(): Promise<void> {
    const select = this.page
      .locator(
        `${this.datasetVersionDropdown} .mat-mdc-select, ${this.datasetVersionDropdown} mat-select`
      )
      .first();
    await select.click();

    const panel = this.page
      .locator(".mat-mdc-select-panel, .cdk-overlay-pane .mat-mdc-select-panel")
      .first();
    await panel.waitFor({ state: "visible", timeout: 5_000 });

    // Click the first available option
    const firstOption = panel.locator(".mat-mdc-option").first();
    await firstOption.click();
    await this.page.waitForTimeout(500);
  }

  async isDatasetVersionDropdownVisible(): Promise<boolean> {
    return this.page
      .locator(this.datasetVersionDropdown)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isGenerateVersionButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.generateVersionButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Step 2: Model Name ─────────────────────────────────────────────────

  async fillModelName(name: string): Promise<void> {
    const input = this.page
      .locator(`${this.modelNameInput} input`)
      .first();
    await input.fill(name);
    // Wait for async uniqueness validator to settle
    await this.page.waitForTimeout(500);
  }

  async getModelNameError(): Promise<string> {
    return (
      (await this.page
        .locator(this.modelNameError)
        .first()
        .textContent()
        .catch(() => "")) || ""
    ).trim();
  }

  async isModelNameErrorVisible(): Promise<boolean> {
    return this.page
      .locator(this.modelNameError)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  // ── Step 3: Model Description ───────────────────────────────────────────

  async fillModelDescription(description: string): Promise<void> {
    const textarea = this.page
      .locator(
        `${this.modelDescriptionInput} textarea, ${this.modelDescriptionInput} input`
      )
      .first();
    await textarea.fill(description);
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async clickStartTraining(): Promise<void> {
    await this.page.locator(this.startButton).first().click();
  }

  async isStartButtonEnabled(): Promise<boolean> {
    return this.page
      .locator(this.startButton)
      .first()
      .isEnabled()
      .catch(() => false);
  }

  async isStartButtonDisabled(): Promise<boolean> {
    return this.page
      .locator(this.startButton)
      .first()
      .isDisabled()
      .catch(() => true);
  }

  async isStartButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.startButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  /**
   * Wait for the training start request spinner to disappear.
   */
  async waitForTrainingStart(timeout = 60_000): Promise<void> {
    const spinner = this.page.locator(this.startSpinner).first();
    if (await spinner.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await spinner.waitFor({ state: "hidden", timeout });
    }
  }
}
