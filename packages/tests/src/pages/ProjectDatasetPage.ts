import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * ProjectDatasetPage — dataset/images page at /project/:id/dataset/images.
 *
 * DOM reference:
 * - Root:         <div class="dataset">
 * - Upload btn:   button with text "Upload Dataset"
 * - Image count:  class="dataset__header-counter"
 * - Class count:  class="dataset__header-class-number"
 * - Empty state:  text "Clean slate" or "Unleash your vision"
 */
export class ProjectDatasetPage extends BasePage {
  private readonly root = ".dataset";
  private readonly uploadButton = 'button:has-text("Upload Dataset"), button:has-text("Upload")';
  private readonly imageCounter = ".dataset__header-counter";
  private readonly classCounter = ".dataset__header-class-number";
  private readonly masonryGrid = "sc-masonry-grid, .masonry-grid";
  private readonly emptyState = ".dataset__empty-state, .dataset__container:has-text('unleash')";

  constructor(page: Page) {
    super(page);
  }

  async goto(projectId: string): Promise<void> {
    await this.navigate(`/project/${projectId}/dataset/images`);
    await this.waitForReady();
  }

  async isLoaded(): Promise<boolean> {
    return this.page.locator(this.root).first().isVisible({ timeout: 15000 }).catch(() => false);
  }

  async isUploadButtonVisible(): Promise<boolean> {
    return this.page.locator(this.uploadButton).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async isImageCounterVisible(): Promise<boolean> {
    return this.page.locator(this.imageCounter).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async hasImages(): Promise<boolean> {
    return this.page.locator(this.masonryGrid).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  async hasEmptyState(): Promise<boolean> {
    const text = await this.page.locator(this.root).first().innerText().catch(() => "");
    return text.includes("unleash") || text.includes("Clean slate") || text.includes("Upload");
  }
}
