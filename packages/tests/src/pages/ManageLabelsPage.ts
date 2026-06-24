import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ManageLabelsPage — manage labels at /project/:id/dataset/manage-labels.
 *
 * DOM reference:
 * - Root:          <div id="manage-labels-page" class="manage-labels">
 * - Title:         <element id="manage-labels-title">
 * - Guide button:  <button id="manage-labels-open-labeling-guide">
 * - Add Label:     <button id="manage-labels-header-add-label">
 * - Table:         <sc-table-with-input id="manage-labels-table">
 * - Empty state:   <div id="manage-labels-empty-state">
 * - Empty CTA:     <button id="manage-labels-empty-add-labels">
 */
export class ManageLabelsPage extends BasePage {
  private readonly root = "#manage-labels-page";
  private readonly title = "#manage-labels-title";
  private readonly guideButton = "#manage-labels-open-labeling-guide";
  private readonly addLabelButton = "#manage-labels-header-add-label";
  private readonly table = "#manage-labels-table";
  private readonly emptyState = "#manage-labels-empty-state";
  private readonly emptyAddButton = "#manage-labels-empty-add-labels";

  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/dataset/manage-labels`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 15000 }).catch(() => false);
  }

  async isTitleVisible(): Promise<boolean> {
    return this.page.locator(this.title).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isGuideButtonVisible(): Promise<boolean> {
    return this.page.locator(this.guideButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isAddLabelButtonVisible(): Promise<boolean> {
    return this.page.locator(this.addLabelButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isTableVisible(): Promise<boolean> {
    return this.page.locator(this.table).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }
}
