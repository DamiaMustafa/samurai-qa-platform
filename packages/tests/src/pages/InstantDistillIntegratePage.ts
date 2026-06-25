import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * InstantDistillIntegratePage — Instant Distill integrate step (Step 3 of stepper).
 *
 * DOM reference (verified against Angular template):
 * - Root:               <div id="instant-distill-integrate-page">
 * - API panel:          <div id="instant-distill-integrate-api-panel">
 * - API inference:      <div id="instant-distill-integrate-api-inference">
 * - Create API Key:     <button id="instant-distill-integrate-create-api-key-button">
 * - Integrate button:   <button id="instant-distill-integrate-button">
 * - Copy endpoint:       <button id="instant-distill-integrate-copy-endpoint-button">
 * - API code block:     <pre id="instant-distill-integrate-api-code">
 * - Copy code:          <button id="instant-distill-integrate-copy-code-button">
 * - Go to API Keys:     <button id="instant-distill-integrate-go-api-keys-button">
 * - Back button:        <button id="instant-distill-integrate-back-button">
 *
 * RouterLinks:
 * - Create API Key → /api-keys/create
 * - Go to API Keys → /api-keys
 *
 * No form fields — this page is read-only with copy actions and navigation.
 */
export class InstantDistillIntegratePage extends BasePage {
  private readonly root = "#instant-distill-integrate-page";

  // API panel
  private readonly apiPanel = "#instant-distill-integrate-api-panel";
  private readonly apiInference = "#instant-distill-integrate-api-inference";
  private readonly apiCode = "#instant-distill-integrate-api-code";

  // Buttons
  private readonly createApiKeyButton = "#instant-distill-integrate-create-api-key-button";
  private readonly integrateButton = "#instant-distill-integrate-button";
  private readonly copyEndpointButton = "#instant-distill-integrate-copy-endpoint-button";
  private readonly copyCodeButton = "#instant-distill-integrate-copy-code-button";
  private readonly goApiKeysButton = "#instant-distill-integrate-go-api-keys-button";
  private readonly backButton = "#instant-distill-integrate-back-button";

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/instant-distill/${projectId}/integrate`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page
      .locator(this.root)
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
  }

  // ── API Panel ──────────────────────────────────────────────────────────

  async isApiPanelVisible(): Promise<boolean> {
    return this.page
      .locator(this.apiPanel)
      .first()
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
  }

  async getApiCodeText(): Promise<string> {
    return (
      (await this.page
        .locator(this.apiCode)
        .first()
        .textContent()
        .catch(() => "")) || ""
    ).trim();
  }

  // ── Buttons ────────────────────────────────────────────────────────────

  async clickCopyEndpoint(): Promise<void> {
    await this.page.locator(this.copyEndpointButton).first().click();
  }

  async clickCopyCode(): Promise<void> {
    await this.page.locator(this.copyCodeButton).first().click();
  }

  async clickIntegrate(): Promise<void> {
    await this.page.locator(this.integrateButton).first().click();
  }

  async isIntegrateDisabled(): Promise<boolean> {
    return this.page
      .locator(this.integrateButton)
      .first()
      .isDisabled()
      .catch(() => true);
  }

  async isIntegrateVisible(): Promise<boolean> {
    return this.page
      .locator(this.integrateButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isLoadingSpinnerVisible(): Promise<boolean> {
    // When isLoading is true, a mat-spinner appears inside the integrate button
    return this.page
      .locator(`${this.integrateButton} mat-spinner, .instant-distill-integrate__spinner`)
      .first()
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  async clickBack(): Promise<void> {
    await this.page.locator(this.backButton).first().click();
  }

  // ── RouterLink Buttons ─────────────────────────────────────────────────

  async isCreateApiKeyButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.createApiKeyButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async isGoApiKeysButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.goApiKeysButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }
}
