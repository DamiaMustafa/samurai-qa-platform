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

  // ── Header: Language Selector ────────────────────────────────────────────
  private readonly languageDropdown =
    'select[class*="lang"], [class*="language"] select, [class*="lang-selector"], ' +
    '[class*="language-selector"], [role="combobox"][class*="lang"], ' +
    'button[class*="lang"], [class*="locale"]';

  private readonly languageOptions =
    'option, [role="option"], [role="listbox"] > *, .mat-option, li[class*="lang"]';

  // ── Header: User Avatar ──────────────────────────────────────────────────
  private readonly userAvatar =
    'img[class*="avatar"], [class*="avatar"] img, [class*="profile-pic"] img, ' +
    '[class*="user-image"] img, img[class*="profile"], [class*="avatar"], ' +
    '[class*="user-avatar"]';

  // ── Header: Role Label ───────────────────────────────────────────────────
  private readonly roleLabel =
    '[class*="role"], [class*="user-role"], span[class*="role"], ' +
    '[class*="badge"]:has-text("Admin"), [class*="badge"]:has-text("Editor"), ' +
    '[class*="badge"]:has-text("User"), [class*="role-badge"]';

  // ── Header: User Menu Dropdown ───────────────────────────────────────────
  private readonly userMenuButton =
    'button[class*="user-menu"], [class*="user-menu"] > button, ' +
    '[class*="profile-menu"] > button, button[class*="account"], ' +
    '[class*="header"] button:has(img), [class*="header"] button:has([class*="avatar"])';

  private readonly userMenuDropdown =
    '[class*="user-menu"] [role="menu"], [class*="user-dropdown"], ' +
    '[class*="profile-menu"] [role="menu"], [class*="dropdown-menu"], ' +
    '[class*="account-menu"], .cdk-overlay-pane [role="menu"]';

  private readonly userMenuItem =
    '[role="menuitem"], .menu-item, button, a';

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

  // ── Language Selector ─────────────────────────────────────────────────────

  async isLanguageSelectorVisible(): Promise<boolean> {
    return this.isVisible(this.languageDropdown);
  }

  async getCurrentLanguage(): Promise<string> {
    const el = this.page.locator(this.languageDropdown).first();
    // If it's a <select>, get the selected option text
    const tagName = await el.evaluate((e) => e.tagName.toLowerCase());
    if (tagName === "select") {
      return el.locator("option:checked").textContent().then((t) => (t || "").trim()).catch(() => "");
    }
    // Otherwise return the element's text content
    return ((await el.textContent()) || "").trim();
  }

  async openLanguageDropdown(): Promise<void> {
    const el = this.page.locator(this.languageDropdown).first();
    const tagName = await el.evaluate((e) => e.tagName.toLowerCase());
    if (tagName === "select") {
      // Native select — no dropdown to open, options are inline
      return;
    }
    await el.click();
    await this.page
      .locator(this.languageOptions)
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async getLanguageOptions(): Promise<string[]> {
    const el = this.page.locator(this.languageDropdown).first();
    const tagName = await el.evaluate((e) => e.tagName.toLowerCase()).catch(() => "");
    const optionsLocator =
      tagName === "select"
        ? el.locator("option")
        : this.page.locator(this.languageOptions);
    const count = await optionsLocator.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await optionsLocator.nth(i).textContent()) || "").trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async selectLanguage(language: string): Promise<void> {
    const el = this.page.locator(this.languageDropdown).first();
    const tagName = await el.evaluate((e) => e.tagName.toLowerCase()).catch(() => "");
    if (tagName === "select") {
      await el.selectOption({ label: language });
    } else {
      await el.click();
      const option = this.page
        .locator(this.languageOptions)
        .filter({ hasText: new RegExp(language, "i") })
        .first();
      await option.click();
    }
  }

  // ── User Avatar ───────────────────────────────────────────────────────────

  async isUserAvatarVisible(): Promise<boolean> {
    return this.isVisible(this.userAvatar);
  }

  async getUserAvatarSrc(): Promise<string> {
    const img = this.page.locator(this.userAvatar).first();
    return (await img.getAttribute("src")) || "";
  }

  async getUserAvatarAlt(): Promise<string> {
    const img = this.page.locator(this.userAvatar).first();
    return (await img.getAttribute("alt")) || "";
  }

  // ── Role Label ────────────────────────────────────────────────────────────

  async isRoleLabelVisible(): Promise<boolean> {
    return this.isVisible(this.roleLabel);
  }

  async getRoleLabelText(): Promise<string> {
    const label = this.page.locator(this.roleLabel).first();
    return ((await label.textContent()) || "").trim();
  }

  // ── User Menu Dropdown ────────────────────────────────────────────────────

  async isUserMenuButtonVisible(): Promise<boolean> {
    return this.isVisible(this.userMenuButton);
  }

  async openUserMenu(): Promise<void> {
    const btn = this.page.locator(this.userMenuButton).first();
    await btn.click();
    await this.page
      .locator(this.userMenuDropdown)
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async isUserMenuOpen(): Promise<boolean> {
    return this.isVisible(this.userMenuDropdown);
  }

  async getUserMenuItems(): Promise<string[]> {
    const dropdown = this.page.locator(this.userMenuDropdown).first();
    const items = dropdown.locator(this.userMenuItem);
    const count = await items.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await items.nth(i).textContent()) || "").trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async clickUserMenuItem(itemText: string): Promise<void> {
    const dropdown = this.page.locator(this.userMenuDropdown).first();
    const item = dropdown
      .locator(this.userMenuItem)
      .filter({ hasText: new RegExp(itemText, "i") })
      .first();
    await item.click();
  }

  async closeUserMenu(): Promise<void> {
    await this.clickOutside();
  }
}
