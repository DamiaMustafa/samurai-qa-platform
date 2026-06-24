import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * DatasetOverviewPage — dataset overview at /project/:id/dataset/overview.
 *
 * DOM reference (from dataset/overview/overview.component.html):
 * - Page wrapper:         #overview-page
 * - Content (has data):   #overview-content
 * - Total images value:   #overview-total-images-value
 * - Refresh button:       #overview-refresh-metrics-button
 * - Data split section:   #overview-data-split-section
 * - Split bar:            #overview-data-split-bar
 * - Labelled chart:       [data-chart-id="labelled_per_split"]
 * - Class dist chart:     [data-chart-id="image_per_class"]
 * - Empty state:          #overview-empty-state
 * - Upload button:        #overview-upload-dataset-button
 */
export class DatasetOverviewPage extends BasePage {
  private readonly root = "#overview-page";
  private readonly contentSection = "#overview-content";
  private readonly totalImagesValue = "#overview-total-images-value";
  private readonly refreshButton = "#overview-refresh-metrics-button";
  private readonly dataSplitSection = "#overview-data-split-section";
  private readonly splitBar = "#overview-data-split-bar";
  private readonly emptyState = "#overview-empty-state";
  private readonly uploadButton = "#overview-upload-dataset-button";

  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/dataset/overview`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 15000 }).catch(() => false);
  }

  async hasData(): Promise<boolean> {
    return this.page.locator(this.contentSection).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isTotalImagesVisible(): Promise<boolean> {
    return this.page.locator(this.totalImagesValue).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getTotalImages(): Promise<string> {
    return (await this.page.locator(this.totalImagesValue).first().textContent())?.trim() || "0";
  }

  async isRefreshButtonVisible(): Promise<boolean> {
    return this.page.locator(this.refreshButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isDataSplitSectionVisible(): Promise<boolean> {
    return this.page.locator(this.dataSplitSection).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isSplitBarVisible(): Promise<boolean> {
    return this.page.locator(this.splitBar).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isUploadButtonVisible(): Promise<boolean> {
    return this.page.locator(this.uploadButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isLabelledChartVisible(): Promise<boolean> {
    return this.page.locator('[data-chart-id="labelled_per_split"]').first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isClassDistributionChartVisible(): Promise<boolean> {
    return this.page.locator('[data-chart-id="image_per_class"]').first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async waitForCharts(): Promise<void> {
    await this.page.waitForTimeout(3000);
  }
}
