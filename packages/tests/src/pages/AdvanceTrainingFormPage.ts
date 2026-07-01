import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * AdvanceTrainingFormPage — advanced training form at
 * /project/:id/train/advance-training.
 *
 * DOM reference (verified against Angular template):
 * - Root:              <div id="advance-training-page" class="advance-training">
 * - Title:             <span id="advance-training-title">
 * - View toggle:       Form / JSON buttons with .active-- class
 * - Steps:             <div id="advance-training-steps">
 * - Step 1 (Snapshot): <div id="advance-training-step-1">
 * - Dataset version:   <sc-dropdown id="advance-training-dataset-version">
 * - Generate version:  <button id="advance-training-generate-version">
 * - Gen spinner:       <mat-spinner id="advance-training-generate-version-spinner">
 * - Step 2 (Model):    <div id="advance-training-step-2">
 * - Model name:        <sc-input id="advance-training-model-name">
 * - Model type:        <sc-dropdown> (no explicit ID, inside step-2 first row)
 * - Launch training:   <button> inside .advance-training__train (form view)
 *
 * Model types per project type (from advance-training.component.ts):
 *   classification:   yolo26s/n/m/l/x, yolov8s/n  (7 options)
 *   object_detection: yolo26s/n/m/l/x, yolov8s/n/m/l/x  (10 options)
 *   segmentation:     yolo26s/n/m/l/x  (5 options, mask_rcnn filtered out)
 */
export class AdvanceTrainingFormPage extends BasePage {
  private readonly root = "#advance-training-page";
  private readonly title = "#advance-training-title";
  private readonly stepsContainer = "#advance-training-steps";

  // Step 1: Dataset snapshot
  private readonly step1 = "#advance-training-step-1";
  private readonly datasetVersionDropdown = "#advance-training-dataset-version";
  private readonly generateVersionButton = "#advance-training-generate-version";
  private readonly generateSpinner = "#advance-training-generate-version-spinner";

  // Step 2: Model prep
  private readonly step2 = "#advance-training-step-2";
  private readonly modelNameInput = "#advance-training-model-name";
  // Model type dropdown has no explicit ID — it's the first sc-dropdown
  // in the first .advance-training__step-section-row within step 2
  private readonly modelTypeDropdown =
    "#advance-training-step-2 .advance-training__step-section-row:first-of-type sc-dropdown";

  // Launch training (form view — first .advance-training__train div)
  private readonly launchTrainingContainer = ".advance-training__train";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/train/advance-training`);
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

  async clickGenerateVersion(): Promise<void> {
    await this.page.locator(this.generateVersionButton).first().click();
    const spinner = this.page.locator(this.generateSpinner).first();
    if (await spinner.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await spinner.waitFor({ state: "hidden", timeout: 60_000 });
    }
  }

  async selectFirstDatasetVersion(): Promise<void> {
    await this.selectDropdownFirstOption(this.datasetVersionDropdown);
  }

  // ── Step 2: Model Prep ─────────────────────────────────────────────────

  async isModelNameInputVisible(): Promise<boolean> {
    return this.page
      .locator(this.modelNameInput)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async fillModelName(name: string): Promise<void> {
    const input = this.page
      .locator(`${this.modelNameInput} input`)
      .first();
    await input.fill(name);
    await this.page.waitForTimeout(500);
  }

  async isModelTypeDropdownVisible(): Promise<boolean> {
    return this.page
      .locator(this.modelTypeDropdown)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  /**
   * Open the model type dropdown and return all visible option labels.
   */
  async getModelTypeOptions(): Promise<string[]> {
    // Click the mat-select trigger inside the model type dropdown
    const select = this.page
      .locator(`${this.modelTypeDropdown} .mat-mdc-select, ${this.modelTypeDropdown} mat-select`)
      .first();
    await select.click();

    const options = this.page.getByRole("option");
    await options.first().waitFor({ state: "visible", timeout: 5_000 });
    const count = await options.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await options.nth(i).textContent()) || "").trim();
      if (text) labels.push(text);
    }

    // Close dropdown
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(300);

    return labels;
  }

  /**
   * Check if a specific model type option exists in the dropdown.
   */
  async hasModelTypeOption(modelType: string): Promise<boolean> {
    const select = this.page
      .locator(`${this.modelTypeDropdown} .mat-mdc-select, ${this.modelTypeDropdown} mat-select`)
      .first();
    await select.click();

    const option = this.page.getByRole("option", {
      name: new RegExp(`^${modelType}$`, "i"),
    });
    const exists = await option.isVisible().catch(() => false);

    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(300);

    return exists;
  }

  async selectModelType(modelType: string): Promise<void> {
    await this.selectDropdownOptionByText(this.modelTypeDropdown, modelType);
  }

  // ── Launch Training ─────────────────────────────────────────────────────

  /**
   * Check if the launch training button is visible in form view.
   */
  async isLaunchTrainingButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.launchTrainingContainer)
      .first()
      .locator("button")
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  /**
   * Check if the launch training button is disabled.
   * The button is disabled when any form is invalid.
   */
  async isLaunchTrainingButtonDisabled(): Promise<boolean> {
    return this.page
      .locator(this.launchTrainingContainer)
      .first()
      .locator("button")
      .first()
      .isDisabled()
      .catch(() => true);
  }

  async clickLaunchTraining(): Promise<void> {
    await this.page
      .locator(this.launchTrainingContainer)
      .first()
      .locator("button")
      .first()
      .click();
  }

  // ── View Toggle ─────────────────────────────────────────────────────────

  async isFormViewActive(): Promise<boolean> {
    const btn = this.page
      .locator(".advance-training__view-toggle button")
      .first();
    const cls = await btn.getAttribute("class").catch(() => "");
    return cls !== null && cls.includes("active--");
  }

  async isJsonViewActive(): Promise<boolean> {
    const btn = this.page
      .locator(".advance-training__view-toggle button")
      .nth(1);
    const cls = await btn.getAttribute("class").catch(() => "");
    return cls !== null && cls.includes("active--");
  }

  // ── Private Helpers ─────────────────────────────────────────────────────

  private async selectDropdownFirstOption(dropdownSelector: string): Promise<void> {
    const select = this.page
      .locator(`${dropdownSelector} .mat-mdc-select, ${dropdownSelector} mat-select`)
      .first();
    await select.click();

    // Wait for overlay to render, then pick the first role="option"
    await this.page.getByRole("option").first().waitFor({ state: "visible", timeout: 5_000 });
    await this.page.getByRole("option").first().click();
    await this.page.waitForTimeout(500);
  }

  private async selectDropdownOptionByText(
    dropdownSelector: string,
    optionText: string
  ): Promise<void> {
    const select = this.page
      .locator(`${dropdownSelector} .mat-mdc-select, ${dropdownSelector} mat-select`)
      .first();
    await select.click();

    const option = this.page.getByRole("option", {
      name: new RegExp(`^${optionText}$`, "i"),
    });
    await option.waitFor({ state: "visible", timeout: 5_000 });
    await option.click();
    await this.page.waitForTimeout(500);
  }
}
