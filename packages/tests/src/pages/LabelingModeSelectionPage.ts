import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * LabelingModeSelectionPage — labeling mode selection at
 * /project/:id/auto-labelling/grounding-dino or similar route.
 *
 * DOM reference (verified against Angular template):
 * - Root:        <div id="labeling-mode-page" class="labeling-mode">
 * - Radio group: <sc-radio-group id="labeling-mode-radio-group" [style]="'box'">
 * - Back button: <button id="labeling-mode-back">
 * - Next button: <button id="labeling-mode-next">
 *
 * Modes (rendered as mat-radio-button within sc-radio-group):
 *   - "manual"         — Manual labeling
 *   - "grounding-dino" — Advanced AI / Foundation Model
 *   - "pre-trained"    — Pre-trained Model
 *
 * sc-radio-group renders span.radio__text-label for labels; we scope
 *   .mat-mdc-radio-button lookups with :has(span.radio__text-label) to
 *   avoid matching description text inside the full radio button element.
 */
export class LabelingModeSelectionPage extends BasePage {
  private readonly root = "#labeling-mode-page";
  private readonly radioGroup = "#labeling-mode-radio-group";
  private readonly backButton = "#labeling-mode-back";
  private readonly nextButton = "#labeling-mode-next";

  constructor(page: Page) {
    super(page);
  }

  // ── Page Load ───────────────────────────────────────────────────────────

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 30_000 })
      .catch(() => false);
  }

  async waitForReady(): Promise<void> {
    await this.page
      .locator(this.root)
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
  }

  // ── Mode Selection ──────────────────────────────────────────────────────

  async selectMode(
    mode: "manual" | "grounding-dino" | "pre-trained"
  ): Promise<void> {
    const radioGroup = this.page.locator(this.radioGroup);
    // Click the mat-radio-button whose label text matches the mode
    const labels: Record<string, RegExp> = {
      manual: /manual/i,
      "grounding-dino": /advanced|foundation|grounding/i,
      "pre-trained": /pre-?trained/i,
    };
    const button = radioGroup
      .locator(".mat-mdc-radio-button:has(span.radio__text-label)")
      .filter({ hasText: labels[mode] })
      .first();
    await button.click();
    await this.page.waitForTimeout(300);
  }

  async isModeSelected(
    mode: "manual" | "grounding-dino" | "pre-trained"
  ): Promise<boolean> {
    const radioGroup = this.page.locator(this.radioGroup);
    const labels: Record<string, RegExp> = {
      manual: /manual/i,
      "grounding-dino": /advanced|foundation|grounding/i,
      "pre-trained": /pre-?trained/i,
    };
    const button = radioGroup
      .locator(".mat-mdc-radio-button:has(span.radio__text-label)")
      .filter({ hasText: labels[mode] })
      .first();
    // Angular Material adds .mat-mdc-radio-checked to selected radio
    const cls = await button.getAttribute("class").catch(() => "");
    return cls !== null && cls.includes("mat-mdc-radio-checked");
  }

  async isModeDisabled(
    mode: "manual" | "grounding-dino" | "pre-trained"
  ): Promise<boolean> {
    const radioGroup = this.page.locator(this.radioGroup);
    const labels: Record<string, RegExp> = {
      manual: /manual/i,
      "grounding-dino": /advanced|foundation|grounding/i,
      "pre-trained": /pre-?trained/i,
    };
    const button = radioGroup
      .locator(".mat-mdc-radio-button:has(span.radio__text-label)")
      .filter({ hasText: labels[mode] })
      .first();
    const cls = await button.getAttribute("class").catch(() => "");
    return cls !== null && (cls.includes("disabled--") || cls.includes("mat-radio-disabled"));
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  async clickNext(): Promise<void> {
    await this.page.locator(this.nextButton).first().click();
    await this.page.waitForLoadState("networkidle");
  }

  async clickBack(): Promise<void> {
    await this.page.locator(this.backButton).first().click();
    await this.page.waitForLoadState("networkidle");
  }

  async isNextButtonEnabled(): Promise<boolean> {
    return this.page
      .locator(this.nextButton)
      .first()
      .isEnabled()
      .catch(() => false);
  }

  async isNextButtonDisabled(): Promise<boolean> {
    return this.page
      .locator(this.nextButton)
      .first()
      .isDisabled()
      .catch(() => true);
  }

  async isBackButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.backButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }
}
