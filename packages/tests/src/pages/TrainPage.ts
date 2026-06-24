import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * TrainPage — models/training page at /project/:id/train.
 *
 * DOM reference (from train/train.component.html):
 * - Page wrapper:           #models-page
 * - Fast training button:   #models-fast-training
 * - Advanced training btn:  #models-advanced-training
 * - Content section:        #models-content
 * - List header:           #models-list-header
 * - List title:            #models-list-title
 * - Sort control:          #models-sort
 * - Filter control:        #models-filter
 * - Table section:         #models-table-section
 * - Table:                 #models-table
 * - Empty state:           #models-empty-state
 * - Pagination:            #models-pagination
 */
export class TrainPage extends BasePage {
  private readonly root = "#models-page";
  private readonly fastTrainingButton = "#models-fast-training";
  private readonly advancedTrainingButton = "#models-advanced-training";
  private readonly contentSection = "#models-content";
  private readonly listHeader = "#models-list-header";
  private readonly listTitle = "#models-list-title";
  private readonly sortControl = "#models-sort";
  private readonly filterControl = "#models-filter";
  private readonly tableSection = "#models-table-section";
  private readonly table = "#models-table";
  private readonly emptyState = "#models-empty-state";
  private readonly pagination = "#models-pagination";

  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/train`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 15000 }).catch(() => false);
  }

  async isFastTrainingButtonVisible(): Promise<boolean> {
    return this.page.locator(this.fastTrainingButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isAdvancedTrainingButtonVisible(): Promise<boolean> {
    return this.page.locator(this.advancedTrainingButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isContentVisible(): Promise<boolean> {
    return this.page.locator(this.contentSection).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isListHeaderVisible(): Promise<boolean> {
    return this.page.locator(this.listHeader).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isSortVisible(): Promise<boolean> {
    return this.page.locator(this.sortControl).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isFilterVisible(): Promise<boolean> {
    return this.page.locator(this.filterControl).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isTableVisible(): Promise<boolean> {
    return this.page.locator(this.table).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async isPaginationVisible(): Promise<boolean> {
    return this.page.locator(this.pagination).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async hasModels(): Promise<boolean> {
    return !(await this.isEmptyStateVisible());
  }

  async getModelRowCount(): Promise<number> {
    return this.page.locator(`${this.table} tr.models__table-row`).count();
  }

  async waitForTable(): Promise<void> {
    await this.page.waitForTimeout(2000);
  }
}
