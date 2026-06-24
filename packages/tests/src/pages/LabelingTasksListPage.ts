import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * LabelingTasksListPage — labeling tasks list at /project/:id/labeling-tasks/list.
 *
 * DOM reference (from labeling-tasks-list.component.html):
 * - Page wrapper:         .labeling-tasks-list
 * - Header heading:       .labeling-tasks-list__header-heading
 * - Search input:         .labeling-tasks-list__header-search sc-search, input
 * - Table:                .labeling-tasks-list__table sc-table
 * - Pagination:           .labeling-tasks-list__pagination sc-pagination
 */
export class LabelingTasksListPage extends BasePage {
  private readonly root = ".labeling-tasks-list";
  private readonly heading = ".labeling-tasks-list__header-heading";
  private readonly searchInput = ".labeling-tasks-list__header-search input";
  private readonly table = ".labeling-tasks-list__table";
  private readonly pagination = ".labeling-tasks-list__pagination";

  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/labeling-tasks/list`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 15000 }).catch(() => false);
  }

  async isHeadingVisible(): Promise<boolean> {
    return this.page.locator(this.heading).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isSearchVisible(): Promise<boolean> {
    return this.page.locator(this.searchInput).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isTableVisible(): Promise<boolean> {
    return this.page.locator(this.table).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isPaginationVisible(): Promise<boolean> {
    return this.page.locator(this.pagination).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async searchTasks(query: string): Promise<void> {
    const input = this.page.locator(this.searchInput).first();
    await input.fill(query);
    await this.page.waitForTimeout(1000);
  }

  async getTaskRowCount(): Promise<number> {
    return this.page.locator(`${this.table} tr, ${this.table} [role="row"]`).count();
  }

  async waitForTable(): Promise<void> {
    await this.page.waitForTimeout(2000);
  }
}
