import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * UploadDatasetPage — dataset upload flow at /dataset/:id/add (upload-v2 component).
 *
 * DOM reference (verified against Angular template):
 * - Root:            <div id="dataset-flow-upload-page" class="upload">
 * - Type dropdown:   <sc-dropdown id="dataset-flow-upload-dataset-type">
 * - Format radio:    <sc-radio-group id="dataset-flow-upload-label-format">
 * - ZIP input:       <sc-fileInput id="dataset-flow-upload-zip-input">
 * - File input:      <sc-fileInput id="dataset-flow-upload-file-input">
 * - Video input:     <sc-fileInput id="dataset-flow-upload-video-input">
 * - Select files:    <button id="dataset-flow-upload-select-files">
 * - Select folder:   <button id="dataset-flow-upload-select-folder">
 * - Upload button:   <button id="dataset-upload-submit-upload">
 * - Next step:       <button id="dataset-upload-next-step">
 * - Retry:           <button id="dataset-upload-retry-validation">
 * - Progress:        <div id="dataset-upload-file-progress">
 *
 * sc-dropdown wraps Angular Material <mat-select>.
 * sc-fileInput wraps a hidden <input type="file">.
 * sc-radio-group wraps <mat-radio-group> + <mat-radio-button>.
 */
export class UploadDatasetPage extends BasePage {
  private readonly root = "#dataset-flow-upload-page";

  // Dropdowns & radios
  private readonly datasetTypeDropdown = "#dataset-flow-upload-dataset-type";
  private readonly labelFormatRadio = "#dataset-flow-upload-label-format";

  // File inputs (sc-fileInput wrappers containing hidden <input type="file">)
  private readonly zipFileInput = "#dataset-flow-upload-zip-input";
  private readonly fileInput = "#dataset-flow-upload-file-input";
  private readonly videoFileInput = "#dataset-flow-upload-video-input";

  // Unlabelled mode buttons
  private readonly selectFilesButton = "#dataset-flow-upload-select-files";
  private readonly selectFolderButton = "#dataset-flow-upload-select-folder";

  // Action buttons
  private readonly uploadButton = "#dataset-upload-submit-upload";
  private readonly nextStepButton = "#dataset-upload-next-step";
  private readonly retryButton = "#dataset-upload-retry-validation";
  private readonly progressIndicator = "#dataset-upload-file-progress";

  constructor(page: Page) {
    super(page);
  }

  // ── Page Load ───────────────────────────────────────────────────────────

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

  // ── Dataset Type Selection ──────────────────────────────────────────────

  async selectDatasetType(
    type: "labelled" | "unlabelled" | "video"
  ): Promise<void> {
    await this.selectDropdownOption(this.datasetTypeDropdown, type);
  }

  // ── Label Format (labelled mode only) ───────────────────────────────────

  async selectLabelFormat(format: "yolo" | "coco"): Promise<void> {
    const radioGroup = this.page.locator(this.labelFormatRadio);
    const label = format.toUpperCase();
    // Angular Material radio: click the label wrapper to select
    await radioGroup
      .locator(`.mat-mdc-radio-button`)
      .filter({ hasText: new RegExp(`^${label}$`, "i") })
      .first()
      .click();
    await this.page.waitForTimeout(300);
  }

  async isLabelFormatVisible(): Promise<boolean> {
    return this.page
      .locator(this.labelFormatRadio)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── File Upload ─────────────────────────────────────────────────────────

  /**
   * Upload a ZIP file buffer via the labelled-mode file input.
   * Playwright's setInputFiles works on hidden <input type="file"> elements.
   */
  async uploadZipFile(zipBuffer: Buffer, fileName = "test-dataset.zip"): Promise<void> {
    const input = this.page
      .locator(`${this.zipFileInput} input[type="file"]`)
      .first();
    await input.setInputFiles({
      name: fileName,
      mimeType: "application/zip",
      buffer: zipBuffer,
    });
  }

  /**
   * Upload image files for unlabelled mode.
   */
  async uploadFiles(
    files: { name: string; mimeType: string; buffer: Buffer }[]
  ): Promise<void> {
    const input = this.page
      .locator(`${this.fileInput} input[type="file"]`)
      .first();
    await input.setInputFiles(
      files.map((f) => ({
        name: f.name,
        mimeType: f.mimeType,
        buffer: f.buffer,
      }))
    );
  }

  /**
   * Upload a video file for video mode.
   */
  async uploadVideoFile(
    videoBuffer: Buffer,
    fileName = "test-video.mp4"
  ): Promise<void> {
    const input = this.page
      .locator(`${this.videoFileInput} input[type="file"]`)
      .first();
    await input.setInputFiles({
      name: fileName,
      mimeType: "video/mp4",
      buffer: videoBuffer,
    });
  }

  // ── Validation & Submission ─────────────────────────────────────────────

  /**
   * Wait for client-side dataset validation to complete.
   * Resolves when the upload button becomes enabled (validation passed)
   * or throws if the retry button appears (validation failed).
   */
  async waitForValidationComplete(timeout = 60_000): Promise<void> {
    const uploadBtn = this.page.locator(this.uploadButton).first();
    const retryBtn = this.page.locator(this.retryButton).first();

    // Poll until upload is enabled or retry appears
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      // Check if validation failed (retry button visible)
      if (await retryBtn.isVisible().catch(() => false)) {
        throw new Error(
          "Dataset validation failed — retry button appeared. " +
            "Check that the ZIP structure matches the expected format."
        );
      }

      // Check if upload button is enabled (validation passed)
      if (
        (await uploadBtn.isVisible().catch(() => false)) &&
        !(await uploadBtn.isDisabled().catch(() => true))
      ) {
        return;
      }

      await this.page.waitForTimeout(1_000);
    }

    throw new Error(
      `Dataset validation did not complete within ${timeout}ms`
    );
  }

  /**
   * Click the "Upload Dataset" button to submit the validated files.
   */
  async clickUploadDataset(): Promise<void> {
    await this.page.locator(this.uploadButton).first().click();
    // Wait for navigation or next page to load
    await this.page.waitForLoadState("networkidle");
  }

  async isUploadButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.uploadButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isUploadButtonEnabled(): Promise<boolean> {
    return this.page
      .locator(this.uploadButton)
      .first()
      .isEnabled()
      .catch(() => false);
  }

  async isRetryButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.retryButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Tags ────────────────────────────────────────────────────────────────

  async isAddTagVisible(): Promise<boolean> {
    return this.page
      .locator("#dataset-upload-add-tag-trigger")
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Private Helpers ─────────────────────────────────────────────────────

  /**
   * Select an option from an sc-dropdown (Angular Material <mat-select>).
   * The overlay panel is rendered in a CDK overlay container, not inside
   * the dropdown element itself.
   */
  private async selectDropdownOption(
    dropdownSelector: string,
    optionValue: string
  ): Promise<void> {
    // Click the mat-select trigger to open the overlay panel
    const select = this.page
      .locator(`${dropdownSelector} .mat-mdc-select, ${dropdownSelector} mat-select`)
      .first();
    await select.click();

    // Wait for the CDK overlay panel to appear
    const panel = this.page
      .locator(".mat-mdc-select-panel, .cdk-overlay-pane .mat-mdc-select-panel")
      .first();
    await panel.waitFor({ state: "visible", timeout: 5_000 });

    // Click the matching option by visible text
    const option = panel
      .locator(".mat-mdc-option")
      .filter({ hasText: new RegExp(optionValue, "i") })
      .first();
    await option.click();
    await this.page.waitForTimeout(500);
  }
}
