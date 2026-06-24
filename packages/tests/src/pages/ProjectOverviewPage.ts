import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ProjectOverviewPage — project overview at /project/:id/overview.
 *
 * DOM reference (from overview.component.html):
 * - Page wrapper:        #project-overview-page
 * - Project name:        #project-overview-project-name
 * - Project ID:          project-details-info-description with project__project-id
 * - Edit name button:    #project-overview-edit-name-button
 * - Copy ID button:      #project-overview-copy-project-id-button
 * - Change sharing btn:  #project-overview-change-sharing-button
 * - Change thumbnail btn: #project-overview-change-thumbnail-button
 * - Statistics section:   .project__all-statistics-container or .project__statistics-container
 * - Chart canvas:        .chartjs, canvas
 */
export class ProjectOverviewPage extends BasePage {
  private readonly root = "#project-overview-page";
  private readonly projectName = "#project-overview-project-name";
  private readonly editNameButton = "#project-overview-edit-name-button";
  private readonly copyIdButton = "#project-overview-copy-project-id-button";
  private readonly changeSharingButton = "#project-overview-change-sharing-button";
  private readonly changeThumbnailButton = "#project-overview-change-thumbnail-button";

  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/overview`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 15000 }).catch(() => false);
  }

  async isProjectNameVisible(): Promise<boolean> {
    return this.page.locator(this.projectName).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async getProjectName(): Promise<string> {
    return (await this.page.locator(this.projectName).first().textContent())?.trim() || "";
  }

  async isEditNameButtonVisible(): Promise<boolean> {
    return this.page.locator(this.editNameButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isCopyIdButtonVisible(): Promise<boolean> {
    return this.page.locator(this.copyIdButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isChangeSharingButtonVisible(): Promise<boolean> {
    return this.page.locator(this.changeSharingButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isChangeThumbnailButtonVisible(): Promise<boolean> {
    return this.page.locator(this.changeThumbnailButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isStatisticsSectionVisible(): Promise<boolean> {
    const sel = ".project__all-statistics-container, .project__statistics-container";
    return this.page.locator(sel).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isChartVisible(): Promise<boolean> {
    return this.page.locator(".chartjs, canvas").first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async getProjectIdFromUrl(): Promise<string> {
    const url = this.getUrl();
    const match = url.match(/\/project\/([^/]+)/);
    return match ? match[1] : "";
  }

  async waitForCharts(): Promise<void> {
    await this.page.waitForTimeout(2000);
  }
}
