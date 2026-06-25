import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * InstantDistillBuildPage — Instant Distill build form (Step 2 of stepper).
 *
 * DOM reference (verified against Angular template):
 * - Root:               <div id="instant-distill-build-page">
 * - Drop zone:          <div id="instant-distill-build-drop-zone">
 * - File input:         <input id="instant-distill-build-file-input" type="file">
 * - Select file:        <button id="instant-distill-build-select-file-button">
 * - Prompts panel:      <div id="instant-distill-build-prompts-panel">
 * - Prompt input:       <input id="instant-distill-build-prompt-input">
 * - Add prompt:         <button id="instant-distill-build-add-prompt-button">
 * - Prompt chips:       <div id="instant-distill-build-prompt-chips">
 * - Test button:        <button id="instant-distill-build-test-button">
 * - Test spinner:       <mat-spinner id="instant-distill-build-test-spinner">
 * - Download video:     <button id="instant-distill-build-download-video-button">
 * - Download metadata:  <button id="instant-distill-build-download-metadata-button">
 * - Back button:        <button id="instant-distill-build-back-button">
 * - Integrate button:   <button id="instant-distill-build-integrate-button">
 *
 * Dynamic IDs (index-based):
 * - Asset thumb:        #instant-distill-build-asset-thumb-{i}
 * - Asset remove:       #instant-distill-build-asset-remove-{i}
 * - Remove prompt:      #instant-distill-build-remove-prompt-{i}
 * - Prompt chip:        #instant-distill-build-prompt-chip-{i}
 *
 * Form controls:
 * - promptInput:        FormControl<string> (text)
 * - confThresholdPercent: FormControl<number> (slider 0-100)
 * - inferenceIntervalSecs: FormControl<number> (slider 0.2-10)
 *
 * Upload limits: MAX_IMAGES = 20, MAX_VIDEOS = 5, max video duration = 30s
 * Processing state: isProcessing = running || runningVideo || uploadingFiles
 */
export class InstantDistillBuildPage extends BasePage {
  private readonly root = "#instant-distill-build-page";

  // Upload
  private readonly dropZone = "#instant-distill-build-drop-zone";
  private readonly fileInput = "#instant-distill-build-file-input";
  private readonly selectFileButton = "#instant-distill-build-select-file-button";

  // Prompts
  private readonly promptsPanel = "#instant-distill-build-prompts-panel";
  private readonly promptInput = "#instant-distill-build-prompt-input";
  private readonly addPromptButton = "#instant-distill-build-add-prompt-button";
  private readonly promptChips = "#instant-distill-build-prompt-chips";

  // Test / processing
  private readonly testButton = "#instant-distill-build-test-button";
  private readonly testSpinner = "#instant-distill-build-test-spinner";

  // Downloads
  private readonly downloadVideoButton = "#instant-distill-build-download-video-button";
  private readonly downloadMetadataButton = "#instant-distill-build-download-metadata-button";

  // Navigation
  private readonly backButton = "#instant-distill-build-back-button";
  private readonly integrateButton = "#instant-distill-build-integrate-button";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/instant-distill/${projectId}/build`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
  }

  // ── Drop Zone ──────────────────────────────────────────────────────────

  async isDropZoneVisible(): Promise<boolean> {
    return this.page
      .locator(this.dropZone)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async isDropZoneDisabled(): Promise<boolean> {
    const cls = await this.page
      .locator(this.dropZone)
      .first()
      .getAttribute("class")
      .catch(() => "");
    return cls !== null && cls.includes("disabled");
  }

  /**
   * Upload files via the hidden file input.
   * Playwright setInputFiles works on hidden <input type="file">.
   */
  async uploadFiles(
    files: { name: string; mimeType: string; buffer: Buffer }[]
  ): Promise<void> {
    const input = this.page
      .locator(`${this.fileInput} input[type="file"], ${this.fileInput}`)
      .first();
    await input.setInputFiles(
      files.map((f) => ({
        name: f.name,
        mimeType: f.mimeType,
        buffer: f.buffer,
      }))
    );
    // Wait for upload processing
    await this.page.waitForTimeout(1_000);
  }

  async uploadVideo(
    buffer: Buffer,
    fileName = "test-video.mp4"
  ): Promise<void> {
    const input = this.page
      .locator(`${this.fileInput} input[type="file"], ${this.fileInput}`)
      .first();
    await input.setInputFiles({
      name: fileName,
      mimeType: "video/mp4",
      buffer,
    });
    await this.page.waitForTimeout(1_000);
  }

  // ── Assets ─────────────────────────────────────────────────────────────

  async getAssetCount(): Promise<number> {
    // Asset thumbs appear dynamically with index-based IDs
    const thumbs = this.page.locator(
      '[id^="instant-distill-build-asset-thumb-"]'
    );
    return thumbs.count();
  }

  async selectAsset(index: number): Promise<void> {
    await this.page
      .locator(`#instant-distill-build-asset-thumb-${index}`)
      .first()
      .click();
  }

  async clickRemoveAsset(index: number): Promise<void> {
    await this.page
      .locator(`#instant-distill-build-asset-remove-${index}`)
      .first()
      .click();
  }

  // ── Prompts ────────────────────────────────────────────────────────────

  async isPromptsPanelVisible(): Promise<boolean> {
    return this.page
      .locator(this.promptsPanel)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async fillPrompt(text: string): Promise<void> {
    await this.page.locator(this.promptInput).first().fill(text);
  }

  async clickAddPrompt(): Promise<void> {
    await this.page.locator(this.addPromptButton).first().click();
    await this.page.waitForTimeout(300);
  }

  async getPromptChipCount(): Promise<number> {
    return this.page
      .locator('[id^="instant-distill-build-prompt-chip-"]')
      .count();
  }

  async removePromptChip(index: number): Promise<void> {
    await this.page
      .locator(`#instant-distill-build-remove-prompt-${index}`)
      .first()
      .click();
    await this.page.waitForTimeout(300);
  }

  async isAddPromptButtonDisabled(): Promise<boolean> {
    return this.page
      .locator(this.addPromptButton)
      .first()
      .isDisabled()
      .catch(() => true);
  }

  // ── Test Button ────────────────────────────────────────────────────────

  async isTestButtonDisabled(): Promise<boolean> {
    return this.page
      .locator(this.testButton)
      .first()
      .isDisabled()
      .catch(() => true);
  }

  async isTestButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.testButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickTest(): Promise<void> {
    await this.page.locator(this.testButton).first().click();
  }

  async isSpinnerVisible(): Promise<boolean> {
    return this.page
      .locator(this.testSpinner)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  // ── Processing State ───────────────────────────────────────────────────

  async isProcessing(): Promise<boolean> {
    return this.isDropZoneDisabled();
  }

  // ── Download Buttons ──────────────────────────────────────────────────

  async isDownloadVideoVisible(): Promise<boolean> {
    return this.page
      .locator(this.downloadVideoButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isDownloadMetadataVisible(): Promise<boolean> {
    return this.page
      .locator(this.downloadMetadataButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Integrate Button ──────────────────────────────────────────────────

  async isIntegrateButtonDisabled(): Promise<boolean> {
    return this.page
      .locator(this.integrateButton)
      .first()
      .isDisabled()
      .catch(() => true);
  }

  async isIntegrateButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.integrateButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickIntegrate(): Promise<void> {
    await this.page.locator(this.integrateButton).first().click();
  }

  // ── Back Button ────────────────────────────────────────────────────────

  async clickBack(): Promise<void> {
    await this.page.locator(this.backButton).first().click();
  }

  // ── Confidence Slider ──────────────────────────────────────────────────

  async isConfidenceSliderVisible(): Promise<boolean> {
    // The sc-slider component wraps a mat-slider
    return this.page
      .locator(".instant-distill__slider")
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  // ── Inference Interval Slider ─────────────────────────────────────────

  async isInferenceIntervalSliderVisible(): Promise<boolean> {
    // The interval slider only appears when hasVideo is true
    // There should be 2 sliders visible (confidence + interval)
    const sliders = this.page.locator(".instant-distill__slider");
    const count = await sliders.count();
    return count >= 2;
  }
}
