import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * DeployPage — deploy/endpoints page at /project/:id/training/deploy.
 *
 * DOM reference (from deploy/deploy.component.html):
 * - Page wrapper:          #deploy-page
 * - Top section:           #deploy-top-section
 * - Endpoints panel:       #deploy-endpoints-panel
 * - Endpoints toggle:      #deploy-endpoints-toggle
 * - Create endpoint btn:   #deploy-create-endpoint
 * - Active endpoint name:  #deploy-active-endpoint-name
 * - Edit endpoint btn:     #deploy-edit-endpoint
 * - Delete endpoint btn:   #deploy-delete-endpoint
 * - Model details:         #deploy-model-details
 * - Download button:       #deploy-download-model
 * - Tabs:                  #deploy-tabs
 * - Tab try-model:         #deploy-tab-try-model
 * - Tab api:               #deploy-tab-api
 * - Tab mobile:            #deploy-tab-mobile
 * - Empty state:           #deploy-empty-state
 * - Go to models btn:      #deploy-go-to-models
 */
export class DeployPage extends BasePage {
  private readonly root = "#deploy-page";
  private readonly topSection = "#deploy-top-section";
  private readonly endpointsPanel = "#deploy-endpoints-panel";
  private readonly endpointsToggle = "#deploy-endpoints-toggle";
  private readonly createEndpointButton = "#deploy-create-endpoint";
  private readonly activeEndpointName = "#deploy-active-endpoint-name";
  private readonly editEndpointButton = "#deploy-edit-endpoint";
  private readonly deleteEndpointButton = "#deploy-delete-endpoint";
  private readonly modelDetails = "#deploy-model-details";
  private readonly downloadButton = "#deploy-download-model";
  private readonly tabs = "#deploy-tabs";
  private readonly tabTryModel = "#deploy-tab-try-model";
  private readonly tabApi = "#deploy-tab-api";
  private readonly tabMobile = "#deploy-tab-mobile";
  private readonly emptyState = "#deploy-empty-state";
  private readonly goToModelsButton = "#deploy-go-to-models";

  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/training/deploy`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 15000 }).catch(() => false);
  }

  async hasEndpoints(): Promise<boolean> {
    return this.page.locator(this.topSection).first().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.page.locator(this.emptyState).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isCreateEndpointButtonVisible(): Promise<boolean> {
    return this.page.locator(this.createEndpointButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isEndpointsToggleVisible(): Promise<boolean> {
    return this.page.locator(this.endpointsToggle).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isActiveEndpointNameVisible(): Promise<boolean> {
    return this.page.locator(this.activeEndpointName).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isEditEndpointButtonVisible(): Promise<boolean> {
    return this.page.locator(this.editEndpointButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isDeleteEndpointButtonVisible(): Promise<boolean> {
    return this.page.locator(this.deleteEndpointButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isModelDetailsVisible(): Promise<boolean> {
    return this.page.locator(this.modelDetails).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isDownloadButtonVisible(): Promise<boolean> {
    return this.page.locator(this.downloadButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isTabsSectionVisible(): Promise<boolean> {
    return this.page.locator(this.tabs).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isTryModelTabVisible(): Promise<boolean> {
    return this.page.locator(this.tabTryModel).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isApiTabVisible(): Promise<boolean> {
    return this.page.locator(this.tabApi).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isMobileTabVisible(): Promise<boolean> {
    return this.page.locator(this.tabMobile).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isGoToModelsButtonVisible(): Promise<boolean> {
    return this.page.locator(this.goToModelsButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async waitForEndpoints(): Promise<void> {
    await this.page.waitForTimeout(3000);
  }
}
