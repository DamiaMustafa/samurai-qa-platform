import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ProjectCreationPage — project creation form at /project-creation.
 *
 * DOM reference (verified against Angular template):
 * - Root:                <div id="project-creation-page" class="create-project">
 * - Type cards:
 *   - Object Detection:  <button id="project-creation-type-object-detection">
 *   - Classification:    <button id="project-creation-type-classification">
 *   - Segmentation:      <button id="project-creation-type-segmentation">
 * - Name input:          <sc-input id="project-creation-name-input">
 * - Description:         <sc-textarea id="project-creation-description-input">
 * - Default Labeler:     <sc-dropdown id="project-creation-default-labeler-dropdown">
 * - Default Reviewer:    <sc-dropdown id="project-creation-default-reviewer-dropdown">
 * - Platform Version:    <sc-radio-group id="project-creation-platform-version-radio">
 * - Classification Type: <sc-radio-group id="project-creation-platform-version-radio">
 *   (duplicate ID — scoped via :has(span.radio__text-label) matching multi/single)
 * - Sharing Options:     <sc-radio-group id="project-creation-sharing-options-radio">
 * - Submit:              <button id="project-creation-submit-button">
 * - Success Dialog:      <div id="project-creation-success-dialog">
 * - Success Skip:        <button id="project-creation-success-skip">
 */
export class ProjectCreationPage extends BasePage {
  private readonly root = "#project-creation-page";

  // Type selection
  private readonly typeObjectDetection = "#project-creation-type-object-detection";
  private readonly typeClassification = "#project-creation-type-classification";
  private readonly typeSegmentation = "#project-creation-type-segmentation";

  // Form fields
  private readonly nameInput = "#project-creation-name-input";
  private readonly descriptionInput = "#project-creation-description-input";
  private readonly labelerDropdown = "#project-creation-default-labeler-dropdown";
  private readonly reviewerDropdown = "#project-creation-default-reviewer-dropdown";
  private readonly platformVersionRadio = "#project-creation-platform-version-radio";
  // Classification type radio group shares the same ID as platform version.
  // Use :has() to scope to the group containing multi/single label options.
  private readonly classificationTypeRadio = 'sc-radio-group:has(span.radio__text-label:is(:text("Multi-label"), :text("Single-label")))';
  private readonly sharingRadio = "#project-creation-sharing-options-radio";
  private readonly submitButton = "#project-creation-submit-button";

  // Success dialog
  private readonly successDialog = "#project-creation-success-dialog";
  private readonly successSkip = "#project-creation-success-skip";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/project-creation");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  // ── Type Selection ──────────────────────────────────────────────────────

  async isTypeSelectionVisible(): Promise<boolean> {
    const od = await this.page.locator(this.typeObjectDetection).first().isVisible().catch(() => false);
    const cls = await this.page.locator(this.typeClassification).first().isVisible().catch(() => false);
    const seg = await this.page.locator(this.typeSegmentation).first().isVisible().catch(() => false);
    return od && cls && seg;
  }

  async selectType(type: "object_detection" | "classification" | "segmentation"): Promise<void> {
    const selectors: Record<string, string> = {
      object_detection: this.typeObjectDetection,
      classification: this.typeClassification,
      segmentation: this.typeSegmentation,
    };
    await this.page.locator(selectors[type]).first().click();
    await this.page.waitForTimeout(500);
  }

  async isTypeSelected(type: "object_detection" | "classification" | "segmentation"): Promise<boolean> {
    const selectors: Record<string, string> = {
      object_detection: this.typeObjectDetection,
      classification: this.typeClassification,
      segmentation: this.typeSegmentation,
    };
    const btn = this.page.locator(selectors[type]).first();
    // Selected type does NOT have .not-selected class on its parent card
    const parentCard = btn.locator("xpath=ancestor::div[contains(@class, 'project-type__choice')]");
    const cls = await parentCard.getAttribute("class").catch(() => "");
    return cls !== null && !cls.includes("not-selected");
  }

  // ── Form Fields ─────────────────────────────────────────────────────────

  async isNameInputVisible(): Promise<boolean> {
    return this.page.locator(this.nameInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async fillName(name: string): Promise<void> {
    const input = this.page.locator(`${this.nameInput} input`).first();
    await input.fill(name);
  }

  async isDescriptionVisible(): Promise<boolean> {
    return this.page.locator(this.descriptionInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async fillDescription(description: string): Promise<void> {
    const textarea = this.page.locator(`${this.descriptionInput} textarea, ${this.descriptionInput} input`).first();
    await textarea.fill(description);
  }

  async isLabelerDropdownVisible(): Promise<boolean> {
    return this.page.locator(this.labelerDropdown).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isReviewerDropdownVisible(): Promise<boolean> {
    return this.page.locator(this.reviewerDropdown).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ── Sharing Options ─────────────────────────────────────────────────────

  async isSharingOptionsVisible(): Promise<boolean> {
    return this.page.locator(this.sharingRadio).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async selectSharing(sharing: "private" | "public"): Promise<void> {
    const radioGroup = this.page.locator(this.sharingRadio);
    const labelPattern = sharing === "private" ? /private/i : /public/i;
    const labelSpan = radioGroup
      .locator("span.radio__text-label")
      .filter({ hasText: labelPattern });
    await labelSpan.first().waitFor({ state: "visible", timeout: 15_000 });
    await labelSpan.first().click({ timeout: 15_000 });
    await this.page.waitForTimeout(300);
  }

  // ── Platform Version ────────────────────────────────────────────────────

  async isPlatformVersionVisible(): Promise<boolean> {
    return this.page.locator(this.platformVersionRadio).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async selectVersion(version: "v1" | "v2"): Promise<void> {
    const radioGroup = this.page.locator(this.platformVersionRadio).first();
    const label = version.toUpperCase();
    // Wait for translations to load — versionItems is populated async via translate.get()
    // Target the label span directly since the radio button also contains description text
    // which breaks /^V1$/ regex matching on the full element text content
    const labelSpan = radioGroup
      .locator("span.radio__text-label")
      .filter({ hasText: label });
    await labelSpan.first().waitFor({ state: "visible", timeout: 30_000 });
    await labelSpan.first().click({ timeout: 30_000 });
    await this.page.waitForTimeout(300);
  }

  async isVersionSelected(version: "v1" | "v2"): Promise<boolean> {
    const radioGroup = this.page.locator(this.platformVersionRadio).first();
    const label = version.toUpperCase();
    const button = radioGroup
      .locator(`mat-radio-button`)
      .filter({ has: this.page.locator("span.radio__text-label", { hasText: label }) })
      .first();
    const cls = await button.getAttribute("class").catch(() => "");
    return cls !== null && cls.includes("mat-mdc-radio-checked");
  }

  // ── Classification Type (V2 + Classification only) ─────────────────────

  async isClassificationTypeVisible(): Promise<boolean> {
    return this.page
      .locator(this.classificationTypeRadio)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  async selectClassificationType(type: "multi-label" | "single-label"): Promise<void> {
    const radioGroup = this.page.locator(this.classificationTypeRadio);
    const labelPattern = type === "multi-label" ? /multi/i : /single/i;
    const labelSpan = radioGroup
      .locator("span.radio__text-label")
      .filter({ hasText: labelPattern });
    await labelSpan.first().waitFor({ state: "visible", timeout: 15_000 });
    await labelSpan.first().click({ timeout: 15_000 });
    await this.page.waitForTimeout(300);
  }

  async isClassificationTypeSelected(type: "multi-label" | "single-label"): Promise<boolean> {
    const radioGroup = this.page.locator(this.classificationTypeRadio);
    const labelPattern = type === "multi-label" ? /multi/i : /single/i;
    const button = radioGroup
      .locator("mat-radio-button")
      .filter({ has: this.page.locator("span.radio__text-label", { hasText: labelPattern }) })
      .first();
    const cls = await button.getAttribute("class").catch(() => "");
    return cls !== null && cls.includes("mat-mdc-radio-checked");
  }

  // ── Submit ──────────────────────────────────────────────────────────────

  async isSubmitButtonVisible(): Promise<boolean> {
    return this.page.locator(this.submitButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return this.page.locator(this.submitButton).first().isDisabled().catch(() => true);
  }

  async clickSubmit(): Promise<void> {
    await this.page.locator(this.submitButton).first().click();
  }

  // ── Success Dialog ──────────────────────────────────────────────────────

  async isSuccessDialogVisible(): Promise<boolean> {
    // Real backend API call can take several seconds — wait up to 30s
    const dialogVisible = await this.page
      .locator(this.successDialog)
      .first()
      .isVisible({ timeout: 30_000 })
      .catch(() => false);
    if (dialogVisible) return true;

    // Fallback: check if the upload-dataset button (known to be inside the dialog) is visible
    return this.page
      .locator("#project-creation-success-upload-dataset")
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async clickSuccessSkip(): Promise<void> {
    await this.page.locator(this.successSkip).first().click();
  }

  /**
   * Click "Upload Dataset Now" in the success dialog.
   * The dialog button has id="project-creation-success-upload-dataset"
   * and navigates to /dataset/{id}/add.
   */
  async clickUploadDatasetNow(): Promise<void> {
    await this.page.locator(this.successDialog).first().waitFor({ state: "visible", timeout: 10_000 });
    await this.page.locator("#project-creation-success-upload-dataset").first().click();
  }

  /**
   * Check whether the success dialog's upload button is present.
   */
  async isUploadDatasetButtonVisible(): Promise<boolean> {
    return this.page
      .locator("#project-creation-success-upload-dataset")
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }
}
