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
 * sc-dropdown wraps Angular Material <mat-select>; options render as
 *   role="option" in a CDK overlay listbox (not .mat-mdc-select-panel).
 * sc-fileInput wraps a hidden <input type="file">.
 * sc-radio-group renders span.radio__text-label for labels (not full
 *   .mat-mdc-radio-button text, which also contains description text).
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

  /**
   * Check whether a specific option exists in the dataset type dropdown.
   * Opens the dropdown, checks for the option, then closes it.
   */
  async isDatasetTypeOptionAvailable(
    optionValue: "labelled" | "unlabelled" | "video"
  ): Promise<boolean> {
    const select = this.page
      .locator(
        `${this.datasetTypeDropdown} .mat-mdc-select, ${this.datasetTypeDropdown} mat-select`
      )
      .first();
    await select.click();

    const option = this.page.getByRole("option", {
      name: new RegExp(optionValue, "i"),
    });
    const available = await option.isVisible().catch(() => false);

    // Close dropdown by pressing Escape
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(300);

    return available;
  }

  // ── Label Format (labelled mode only) ───────────────────────────────────

  async selectLabelFormat(format: "yolo" | "coco"): Promise<void> {
    const radioGroup = this.page.locator(this.labelFormatRadio);
    const label = format.toUpperCase();
    // Target span.radio__text-label directly — radio button also contains
    // description text which breaks /^YOLO$/ regex on full element text
    const labelSpan = radioGroup
      .locator("span.radio__text-label")
      .filter({ hasText: label });
    await labelSpan.first().waitFor({ state: "visible", timeout: 20_000 });
    await labelSpan.first().click({ timeout: 20_000 });
    await this.page.waitForTimeout(300);
  }

  async isLabelFormatVisible(): Promise<boolean> {
    return this.page
      .locator(this.labelFormatRadio)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isLabelFormatOptionVisible(format: "yolo" | "coco"): Promise<boolean> {
    const radioGroup = this.page.locator(this.labelFormatRadio);
    const label = format.toUpperCase();
    return radioGroup
      .locator("span.radio__text-label")
      .filter({ hasText: label })
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  // ── File Upload ─────────────────────────────────────────────────────────

  /**
   * Upload a ZIP file via the labelled-mode file input.
   * Accepts either a Buffer (≤50MB, Playwright limit) or a file path (no size limit).
   * Playwright's setInputFiles works on hidden <input type="file"> elements.
   */
  async uploadZipFile(zip: Buffer | string, fileName = "test-dataset.zip"): Promise<void> {
    const input = this.page
      .locator(`${this.zipFileInput} input[type="file"]`)
      .first();
    if (typeof zip === "string") {
      // Path-based upload — no size limit
      await input.setInputFiles(zip);
    } else {
      await input.setInputFiles({
        name: fileName,
        mimeType: "application/zip",
        buffer: zip,
      });
    }
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
  async waitForValidationComplete(timeout = 300_000): Promise<void> {
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
   *
   * After validation, the app may show an "Uploading Information" dialog
   * (CDK overlay) summarizing accepted/rejected images with a "Got it!" button.
   * This dialog blocks pointer events on the upload button, so we dismiss it
   * first if present.
   */
  async clickUploadDataset(): Promise<void> {
    // Dismiss "Uploading Information" dialog if it appeared after validation
    const gotItBtn = this.page
      .locator(".cdk-overlay-pane button:has-text('Got it!')")
      .first();
    if (await gotItBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await gotItBtn.click();
      // Wait for the overlay backdrop to disappear
      await this.page
        .locator(".cdk-overlay-backdrop")
        .waitFor({ state: "hidden", timeout: 5_000 })
        .catch(() => {});
    }

    await this.page.locator(this.uploadButton).first().click();
  }

  /**
   * Wait for the server-side file upload to complete.
   * The upload shows a progress percentage (e.g. "3%", "100%") in a
   * generic element inside the upload area — NOT inside #dataset-upload-file-progress.
   *
   * After the server upload reaches 100%, the app shows a "Next Step" button
   * that must be clicked to navigate to the labeling task creation page.
   *
   * For large ZIPs (500MB+) this can take 30+ minutes on staging
   * depending on upload bandwidth.
   */
  async waitForUploadComplete(timeout = 3_600_000): Promise<void> {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      // Check if we've navigated away from the upload page
      const url = this.page.url();
      if (!url.includes("/add") && !url.includes("/dataset/")) {
        return; // Navigated away — upload complete
      }

      // Check if the upload page is still visible
      const uploadPage = this.page.locator(this.root).first();
      if (!(await uploadPage.isVisible().catch(() => false))) {
        return; // Upload page gone — moved to next step
      }

      // After server upload completes, the app shows a "Next Step" button.
      // Click it to proceed to the labeling task creation page.
      // The button may have id="dataset-upload-next-step" or it may be
      // the same upload button with text changed to "Next Step".
      const nextStepBtn = this.page.locator(
        `${this.nextStepButton}, ${this.uploadButton}:has-text("Next Step")`
      ).first();
      if (await nextStepBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await nextStepBtn.click();
        // Wait for navigation away from the upload page
        await this.page.waitForLoadState("networkidle");
        return;
      }

      // Find the progress percentage in the upload area.
      // Scoped to the upload page root to avoid matching percentages
      // from unrelated page elements (stats widgets, sidebars, etc.).
      const percentEl = this.page.locator(this.root).getByText(/^\d+%$/).first();
      const percentVisible = await percentEl
        .isVisible({ timeout: 1_000 })
        .catch(() => false);

      if (percentVisible) {
        const text = (await percentEl.textContent().catch(() => "")) || "";
        const match = text.match(/(\d+)%/);
        if (match) {
          const pct = parseInt(match[1], 10);
          if (pct < 100) {
            // Still uploading — wait and poll again
            await this.page.waitForTimeout(10_000);
            continue;
          }
          // 100% — wait for "Next Step" button or page transition
          await this.page.waitForTimeout(5_000);
          continue;
        }
      }

      // No percentage visible — upload may have completed or not started.
      // Check if a next-step button or success indicator appeared.
      if (await nextStepBtn.isVisible().catch(() => false)) {
        await nextStepBtn.click();
        await this.page.waitForLoadState("networkidle");
        return;
      }

      // Wait and poll again
      await this.page.waitForTimeout(10_000);
    }

    throw new Error(
      `Server upload did not complete within ${timeout / 60_000} minutes`
    );
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
   * Options render as role="option" inside a role="listbox" in the CDK
   * overlay — not inside .mat-mdc-select-panel — so we use getByRole.
   */
  private async selectDropdownOption(
    dropdownSelector: string,
    optionValue: string
  ): Promise<void> {
    // Click the mat-select trigger to open the overlay panel
    const select = this.page
      .locator(`${dropdownSelector} .mat-mdc-select, ${dropdownSelector} mat-select`)
      .first();
    await select.waitFor({ state: "visible", timeout: 15_000 });
    await select.click();

    // Options render as role="option" inside role="listbox" in the CDK overlay.
    // Use ^ anchor to avoid partial matches — e.g. "labelled" must NOT match
    // "Unlabelled Images" (which contains "labelled" as a substring).
    const option = this.page.getByRole("option", {
      name: new RegExp(`^${optionValue}`, "i"),
    });
    await option.waitFor({ state: "visible", timeout: 10_000 });
    await option.click();
    await this.page.waitForTimeout(500);
  }
}
