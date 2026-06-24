import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ManageTagsPage — manage tags at /project/:id/dataset/manage-tags.
 *
 * DOM reference:
 * - Root:          <div id="tags-page" class="manage-tags">
 * - Heading:       <element id="tags-page-heading">
 * - Add Tag:       <button id="tags-add-new-tag-button">
 * - Table:         <sc-table-with-input id="tags-table-with-input">
 * - Empty state:   <div id="tags-empty-state">
 * - Empty CTA:     <button id="tags-empty-add-tag-button">
 */
export class ManageTagsPage extends BasePage {
  private readonly root = "#tags-page";
  private readonly heading = "#tags-page-heading";
  private readonly addTagButton = "#tags-add-new-tag-button";
  private readonly table = "#tags-table-with-input";
  private readonly emptyState = "#tags-empty-state";
  private readonly emptyAddButton = "#tags-empty-add-tag-button";

  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/dataset/manage-tags`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 15000 }).catch(() => false);
  }

  async isHeadingVisible(): Promise<boolean> {
    return this.page.locator(this.heading).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isAddTagButtonVisible(): Promise<boolean> {
    return this.page.locator(this.addTagButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isTableVisible(): Promise<boolean> {
    return this.page.locator(this.table).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }
}
