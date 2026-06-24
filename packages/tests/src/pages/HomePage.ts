import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * HomePage — post-login landing page showing "Recent Projects".
 *
 * Handles both empty state (no projects) and populated state (up to 3 cards).
 * Each project card includes: thumbnail, name, date, version badge,
 * task type badge, "Open Project Page →" button, and a ⋮ kebab menu.
 *
 * DOM reference: Angular app with custom components and Angular Material.
 */
export class HomePage extends BasePage {
  // ── Selectors (verified against staging DOM) ────────────────────────────

  // Recent Projects section
  private readonly recentProjectsHeading =
    'h2:has-text("Recent Projects"), h3:has-text("Recent Projects"), ' +
    '[class*="recent"] h2, [class*="recent"] h3, ' +
    'h2:has-text("recent"), h3:has-text("recent")';

  // Project cards
  private readonly projectCards =
    '[class*="project-card"], [class*="projectCard"], ' +
    '[class*="recent"] .card, li[class*="project"], ' +
    '[class*="card-item"], [class*="project_card"]';

  // Card inner elements (scoped within a card via .nth(i).locator())
  private readonly projectCardName =
    '[class*="name"], h3, h4, .title, strong, [class*="title"]';

  private readonly projectCardDate =
    '[class*="date"], time, .date, span[class*="date"]';

  private readonly projectCardVersionBadge =
    '[class*="version"], [class*="badge"]:has-text("V"), ' +
    'span:has-text("V"), [class*="chip"]:has-text("V")';

  private readonly projectCardTaskTypeBadge =
    '[class*="task"], [class*="type-badge"], [class*="taskType"], ' +
    '[class*="badge"]:not([class*="version"])';

  private readonly projectCardThumbnail = "img";

  // Open Project button
  private readonly openProjectButton =
    'a:has-text("Open Project"), button:has-text("Open Project"), ' +
    '[class*="open-project"], a:has-text("Open"), button:has-text("Open")';

  // Kebab menu (⋮)
  private readonly kebabMenuButton =
    'button[aria-label*="menu" i], button[aria-label*="more" i], ' +
    'button:has-text("⋮"), [class*="kebab"], [class*="more-vert"], ' +
    'button[aria-haspopup="menu"], button[aria-haspopup="true"]';

  // Kebab menu overlay (opened dropdown)
  private readonly kebabMenuOverlay =
    '[role="menu"], .mat-mdc-menu-panel, .cdk-overlay-pane, ' +
    '.dropdown-menu, [class*="menu-panel"], [class*="dropdown"]';

  // Kebab menu items (scoped within overlay)
  private readonly kebabMenuItem =
    '[role="menuitem"], .mat-mdc-menu-item, button.menu-item, ' +
    '[class*="menu-item"], li[role="option"]';

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/");
    await this.waitForReady();
  }

  // ── Recent Projects Heading ─────────────────────────────────────────────

  async isRecentProjectsHeadingVisible(): Promise<boolean> {
    return this.isVisible(this.recentProjectsHeading);
  }

  async getRecentProjectsHeadingText(): Promise<string> {
    const heading = this.page.locator(this.recentProjectsHeading).first();
    return (await heading.textContent()) || "";
  }

  async expectRecentProjectsHeadingVisible(): Promise<void> {
    await expect(
      this.page.locator(this.recentProjectsHeading).first()
    ).toBeVisible({ timeout: 15000 });
  }

  // ── Project Cards ───────────────────────────────────────────────────────

  async getProjectCardCount(): Promise<number> {
    return this.page.locator(this.projectCards).count();
  }

  async hasProjectCards(): Promise<boolean> {
    return (await this.getProjectCardCount()) > 0;
  }

  async expectMaxProjectCards(): Promise<void> {
    const count = await this.getProjectCardCount();
    expect(count).toBeLessThanOrEqual(3);
  }

  async getProjectCardName(index: number): Promise<string> {
    const card = this.page.locator(this.projectCards).nth(index);
    const name = card.locator(this.projectCardName).first();
    return ((await name.textContent()) || "").trim();
  }

  async getProjectCardDate(index: number): Promise<string> {
    const card = this.page.locator(this.projectCards).nth(index);
    const date = card.locator(this.projectCardDate).first();
    return ((await date.textContent()) || "").trim();
  }

  async getProjectCardVersionBadge(index: number): Promise<string> {
    const card = this.page.locator(this.projectCards).nth(index);
    const badge = card.locator(this.projectCardVersionBadge).first();
    return ((await badge.textContent()) || "").trim();
  }

  async getProjectCardTaskTypeBadge(index: number): Promise<string> {
    const card = this.page.locator(this.projectCards).nth(index);
    const badge = card.locator(this.projectCardTaskTypeBadge).first();
    return ((await badge.textContent()) || "").trim();
  }

  async isProjectCardThumbnailVisible(index: number): Promise<boolean> {
    const card = this.page.locator(this.projectCards).nth(index);
    const img = card.locator(this.projectCardThumbnail).first();
    return img.isVisible();
  }

  // ── Open Project Button ─────────────────────────────────────────────────

  async isOpenProjectButtonVisible(index: number): Promise<boolean> {
    const card = this.page.locator(this.projectCards).nth(index);
    const btn = card.locator(this.openProjectButton).first();
    return btn.isVisible();
  }

  async clickOpenProjectPage(index: number): Promise<void> {
    const card = this.page.locator(this.projectCards).nth(index);
    const btn = card.locator(this.openProjectButton).first();
    await Promise.all([
      this.page.waitForURL((url) => !url.pathname.endsWith("/") && url.pathname !== "", {
        timeout: 15000,
      }).catch(() => {}),
      btn.click(),
    ]);
  }

  // ── Kebab Menu ──────────────────────────────────────────────────────────

  async isKebabMenuButtonVisible(index: number): Promise<boolean> {
    const card = this.page.locator(this.projectCards).nth(index);
    const btn = card.locator(this.kebabMenuButton).first();
    return btn.isVisible();
  }

  async openKebabMenu(index: number): Promise<void> {
    const card = this.page.locator(this.projectCards).nth(index);
    const btn = card.locator(this.kebabMenuButton).first();
    await btn.click();
    // Wait for the menu overlay to appear
    await this.page
      .locator(this.kebabMenuOverlay)
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async isKebabMenuOpen(): Promise<boolean> {
    return this.isVisible(this.kebabMenuOverlay);
  }

  async getKebabMenuItems(): Promise<string[]> {
    const overlay = this.page.locator(this.kebabMenuOverlay).first();
    const items = overlay.locator(this.kebabMenuItem);
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await items.nth(i).textContent()) || "").trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async clickKebabMenuItem(itemText: string): Promise<void> {
    const overlay = this.page.locator(this.kebabMenuOverlay).first();
    const item = overlay
      .locator(this.kebabMenuItem)
      .filter({ hasText: new RegExp(itemText, "i") })
      .first();
    await item.click();
  }

  async clickOutside(): Promise<void> {
    await this.page.locator("body").click({ position: { x: 0, y: 0 } });
    // Brief wait for menu dismiss animation
    await this.page.waitForTimeout(500);
  }

  // ── Assertions ──────────────────────────────────────────────────────────

  async expectProjectCardCount(expected: number): Promise<void> {
    await expect(this.page.locator(this.projectCards)).toHaveCount(expected, {
      timeout: 10000,
    });
  }

  async waitForProjectCards(timeout: number = 10000): Promise<void> {
    await this.page
      .locator(this.projectCards)
      .first()
      .waitFor({ state: "visible", timeout });
  }
}
