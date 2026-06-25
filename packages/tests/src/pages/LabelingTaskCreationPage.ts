import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * LabelingTaskCreationPage — create labeling task at
 * /project/:id/labeling-task/add (add-labeling-task component).
 *
 * DOM reference (verified against Angular template):
 * - Root:           <div id="labeling-task-flow-page" class="add-labeling-task">
 * - Prefix input:   <sc-input id="labeling-task-prefix-input">
 * - Count input:    <sc-input id="labeling-task-count-input">
 * - Create button:  <button id="labeling-task-create-submit">
 * - Success state:  <div id="labeling-task-success-publish">
 * - Success title:  <span id="labeling-task-add-success-title">
 * - Publish button: <button id="labeling-task-publish-dataset">
 * - Failed state:   <div id="labeling-task-publish-failed">
 * - Failed title:   element id="labeling-task-add-failed-title"
 * - Try again:      <button id="labeling-task-publish-try-again">
 *
 * sc-input wraps Angular Material <mat-form-field> with <input matInput>.
 */
export class LabelingTaskCreationPage extends BasePage {
  private readonly root = "#labeling-task-flow-page";
  private readonly prefixInput = "#labeling-task-prefix-input";
  private readonly countInput = "#labeling-task-count-input";
  private readonly createButton = "#labeling-task-create-submit";

  // Success state
  private readonly successContainer = "#labeling-task-success-publish";
  private readonly successTitle = "#labeling-task-add-success-title";
  private readonly publishButton = "#labeling-task-publish-dataset";

  // Failure state
  private readonly failedContainer = "#labeling-task-publish-failed";
  private readonly failedTitle = "#labeling-task-add-failed-title";
  private readonly tryAgainButton = "#labeling-task-publish-try-again";

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

  // ── Task Creation ───────────────────────────────────────────────────────

  async fillTaskPrefix(prefix: string): Promise<void> {
    const input = this.page
      .locator(`${this.prefixInput} input`)
      .first();
    await input.fill(prefix);
  }

  async fillTaskCount(count: number): Promise<void> {
    const input = this.page
      .locator(`${this.countInput} input`)
      .first();
    await input.fill(String(count));
  }

  async isCreateButtonEnabled(): Promise<boolean> {
    return this.page
      .locator(this.createButton)
      .first()
      .isEnabled()
      .catch(() => false);
  }

  async isCreateButtonDisabled(): Promise<boolean> {
    return this.page
      .locator(this.createButton)
      .first()
      .isDisabled()
      .catch(() => true);
  }

  async clickCreate(): Promise<void> {
    await this.page.locator(this.createButton).first().click();
  }

  /**
   * Wait for the task creation request to succeed.
   * The success state container appears when the backend confirms
   * "Your task creation request has been submitted."
   */
  async waitForSubmissionSuccess(timeout = 120_000): Promise<void> {
    await this.page
      .locator(this.successContainer)
      .first()
      .waitFor({ state: "visible", timeout });
  }

  async isSuccessStateVisible(): Promise<boolean> {
    return this.page
      .locator(this.successContainer)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getSuccessTitle(): Promise<string> {
    return (
      (await this.page
        .locator(this.successTitle)
        .first()
        .textContent()
        .catch(() => "")) || ""
    ).trim();
  }

  // ── Failure Handling ────────────────────────────────────────────────────

  async isFailedStateVisible(): Promise<boolean> {
    return this.page
      .locator(this.failedContainer)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getFailedTitle(): Promise<string> {
    return (
      (await this.page
        .locator(this.failedTitle)
        .first()
        .textContent()
        .catch(() => "")) || ""
    ).trim();
  }

  async clickTryAgain(): Promise<void> {
    await this.page.locator(this.tryAgainButton).first().click();
  }

  // ── Publish ─────────────────────────────────────────────────────────────

  async clickPublishDataset(): Promise<void> {
    await this.page.locator(this.publishButton).first().click();
    await this.page.waitForLoadState("networkidle");
  }

  async isPublishButtonVisible(): Promise<boolean> {
    return this.page
      .locator(this.publishButton)
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }
}
