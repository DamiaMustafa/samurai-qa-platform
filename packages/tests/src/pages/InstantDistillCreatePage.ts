import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * InstantDistillCreatePage — Instant Distill create form (Step 1 of stepper).
 *
 * DOM reference (verified against Angular template):
 * - Root:               <div id="instant-distill-create-page">
 * - Type OD:            <button id="instant-distill-create-type-object-detection">
 * - Type CLS:           <button id="instant-distill-create-type-classification">
 * - Type SEG:           <button id="instant-distill-create-type-segmentation">
 * - Name input:         <sc-input id="instant-distill-create-name-input">
 * - Classification:     <sc-radio-group id="project-creation-platform-version-radio">
 * - Next button:        <button id="instant-distill-create-next-button">
 *
 * Type cards use .project-type__choice with .not-selected class on unselected.
 * Classification radio only appears when type === "classification".
 */
export class InstantDistillCreatePage extends BasePage {
  private readonly root = "#instant-distill-create-page";

  // Type selection
  private readonly typeOD = "#instant-distill-create-type-object-detection";
  private readonly typeCLS = "#instant-distill-create-type-classification";
  private readonly typeSEG = "#instant-distill-create-type-segmentation";

  // Form fields
  private readonly nameInput = "#instant-distill-create-name-input";
  private readonly classificationRadio = "#project-creation-platform-version-radio";

  // Actions
  private readonly nextButton = "#instant-distill-create-next-button";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/instant-distill/create");
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  // ── Type Selection ──────────────────────────────────────────────────────

  async isTypeCardVisible(
    type: "object_detection" | "classification" | "segmentation"
  ): Promise<boolean> {
    const selectors: Record<string, string> = {
      object_detection: this.typeOD,
      classification: this.typeCLS,
      segmentation: this.typeSEG,
    };
    return this.page
      .locator(selectors[type])
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async selectType(
    type: "object_detection" | "classification" | "segmentation"
  ): Promise<void> {
    const selectors: Record<string, string> = {
      object_detection: this.typeOD,
      classification: this.typeCLS,
      segmentation: this.typeSEG,
    };
    await this.page.locator(selectors[type]).first().click();
    await this.page.waitForTimeout(500);
  }

  async isTypeSelected(
    type: "object_detection" | "classification" | "segmentation"
  ): Promise<boolean> {
    const selectors: Record<string, string> = {
      object_detection: this.typeOD,
      classification: this.typeCLS,
      segmentation: this.typeSEG,
    };
    const btn = this.page.locator(selectors[type]).first();
    const parentCard = btn.locator(
      "xpath=ancestor::div[contains(@class, 'project-type__choice')]"
    );
    const cls = await parentCard.getAttribute("class").catch(() => "");
    return cls !== null && !cls.includes("not-selected");
  }

  // ── Name Input ─────────────────────────────────────────────────────────

  async fillName(name: string): Promise<void> {
    const input = this.page
      .locator(`${this.nameInput} input`)
      .first();
    await input.fill(name);
  }

  async getNameValue(): Promise<string> {
    return (
      (await this.page
        .locator(`${this.nameInput} input`)
        .first()
        .inputValue()
        .catch(() => "")) || ""
    );
  }

  // ── Classification Type ────────────────────────────────────────────────

  async isClassificationTypeVisible(): Promise<boolean> {
    return this.page
      .locator(this.classificationRadio)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  async selectClassificationType(
    type: "multi-label" | "single-label"
  ): Promise<void> {
    const radioGroup = this.page.locator(this.classificationRadio);
    const label = type === "multi-label" ? /multi/i : /single/i;
    await radioGroup
      .locator(".mat-mdc-radio-button")
      .filter({ hasText: label })
      .first()
      .click();
    await this.page.waitForTimeout(300);
  }

  async isClassificationTypeSelected(
    type: "multi-label" | "single-label"
  ): Promise<boolean> {
    const radioGroup = this.page.locator(this.classificationRadio);
    const label = type === "multi-label" ? /multi/i : /single/i;
    const button = radioGroup
      .locator(".mat-mdc-radio-button")
      .filter({ hasText: label })
      .first();
    const cls = await button.getAttribute("class").catch(() => "");
    return cls !== null && cls.includes("mat-mdc-radio-checked");
  }

  // ── Next Button ────────────────────────────────────────────────────────

  async isNextButtonDisabled(): Promise<boolean> {
    return this.page
      .locator(this.nextButton)
      .first()
      .isDisabled()
      .catch(() => true);
  }

  async isNextButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.nextButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async clickNext(): Promise<void> {
    await this.page.locator(this.nextButton).first().click();
  }
}
