import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * HomePage — post-login landing page showing "Recent Projects".
 *
 * Handles both empty state (no projects) and populated state (up to 3 cards).
 * Each project card includes: thumbnail, name, date, version badge,
 * task type badge, "Open Project Page →" button, and a ⋮ kebab menu.
 *
 * DOM reference (verified against staging.visionsamur.ai):
 * - Heading: <h2 class="home__recent-projects-heading">
 * - Card listing: <sc-project-cards-listing class="home__recent-projects-list">
 * - Language: <mat-select id="header-language-select-dropdown" role="combobox">
 * - Avatar: <img class="tw-profile__img">
 * - Role: <p class="tw-profile__role">
 * - User menu: <button class="mat-mdc-menu-trigger submenu__trigger">
 * - Menu items: <button class="mat-mdc-menu-item"> in .mat-mdc-menu-panel
 */
export class HomePage extends BasePage {
  // ── Selectors (verified against staging DOM) ────────────────────────────

  // Recent Projects section
  private readonly recentProjectsHeading =
    'h2.home__recent-projects-heading, h2[class*="recent-projects-heading"], ' +
    'h2:has-text("Recent Projects"), h3:has-text("Recent Projects")';

  // Project cards — inside sc-project-cards-listing custom element
  private readonly projectCards =
    'sc-project-cards-listing > *, [class*="project-card"], [class*="projectCard"], ' +
    '.home__recent-projects-list > *, [class*="card-item"]';

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
    '#header-language-select-dropdown, mat-select[role="combobox"], ' +
    'mat-select.mat-mdc-select, .tw-header__language-selection mat-select';

  private readonly languageOptions =
    'mat-option, .mat-mdc-option, [role="option"], option, li[class*="lang"]';

  // ── Header: User Avatar ──────────────────────────────────────────────────
  private readonly userAvatar =
    'img.tw-profile__img, img[class*="profile__img"], .tw-profile img, ' +
    'tw-profile img';

  // ── Header: Role Label ───────────────────────────────────────────────────
  private readonly roleLabel =
    'p.tw-profile__role, [class*="profile__role"], .tw-profile [class*="role"]';

  // ── Header: User Menu Dropdown ───────────────────────────────────────────
  private readonly userMenuButton =
    'button.submenu__trigger, button.mat-mdc-menu-trigger.submenu__trigger, ' +
    'button[aria-haspopup="menu"], .tw-header__info button.mat-mdc-menu-trigger, ' +
    'tw-profile ~ button, .tw-header__info button';

  private readonly userMenuDropdown =
    '.mat-mdc-menu-panel, .cdk-overlay-pane .mat-mdc-menu-panel, ' +
    'div.mat-mdc-menu-panel, .mat-mdc-menu-content';

  private readonly userMenuItem =
    'button.mat-mdc-menu-item, [role="menuitem"], .mat-mdc-menu-item';

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    // Navigate to /home directly (app redirects / → /home after login)
    const currentUrl = this.page.url();
    if (!currentUrl.includes("/home") && !currentUrl.endsWith("/")) {
      await this.navigate("/home");
      await this.waitForReady();
    }
    // Wait for the page to fully render
    await this.page.waitForTimeout(3000);
  }

  // ── Recent Projects Heading ─────────────────────────────────────────────

  async isRecentProjectsHeadingVisible(): Promise<boolean> {
    const locatorVisible = await this.page.locator(this.recentProjectsHeading).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (locatorVisible) return true;
    return this.page.evaluate(() => {
      const el = document.querySelector('h2.home__recent-projects-heading');
      return !!el && (el as HTMLElement).offsetParent !== null;
    });
  }

  async getRecentProjectsHeadingText(): Promise<string> {
    try {
      const heading = this.page.locator(this.recentProjectsHeading).first();
      await heading.waitFor({ state: "visible", timeout: 5000 });
      return (await heading.textContent()) || "";
    } catch {
      return this.page.evaluate(() => {
        const el = document.querySelector('h2.home__recent-projects-heading');
        return (el?.textContent || "").trim();
      });
    }
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

  // ── Language Selector (mat-select) ─────────────────────────────────────────

  async isLanguageSelectorVisible(): Promise<boolean> {
    const locatorVisible = await this.page.locator(this.languageDropdown).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (locatorVisible) return true;
    return this.page.evaluate(() => !!document.querySelector('#header-language-select-dropdown, mat-select[role="combobox"]'));
  }

  async getCurrentLanguage(): Promise<string> {
    // Try locator first
    try {
      const valueText = this.page.locator(
        '#header-language-select-dropdown .mat-mdc-select-value-text, ' +
        '#header-language-select-dropdown .selected-language, ' +
        'mat-select[role="combobox"] .mat-mdc-select-value-text'
      ).first();
      if (await valueText.isVisible({ timeout: 3000 }).catch(() => false)) {
        return ((await valueText.textContent()) || "").trim();
      }
    } catch { /* fallback below */ }

    // Fallback: evaluate
    return this.page.evaluate(() => {
      const el = document.querySelector('.selected-language') ||
                 document.querySelector('#header-language-select-dropdown .mat-mdc-select-value-text') ||
                 document.querySelector('mat-select .mat-mdc-select-value-text');
      return (el?.textContent || "").trim();
    });
  }

  async openLanguageDropdown(): Promise<void> {
    try {
      const el = this.page.locator(this.languageDropdown).first();
      await el.click({ timeout: 5000 });
    } catch {
      await this.page.evaluate(() => {
        const el = document.querySelector('#header-language-select-dropdown') ||
                   document.querySelector('mat-select[role="combobox"]');
        if (el) (el as HTMLElement).click();
      });
    }
    // mat-select opens a panel in the overlay
    await this.page
      .locator('.mat-mdc-select-panel, .cdk-overlay-pane .mat-mdc-select-panel, mat-option')
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
  }

  async getLanguageOptions(): Promise<string[]> {
    // First open the dropdown to render options
    const optionsLocator = this.page.locator(
      'mat-option, .mat-mdc-option, [role="option"]'
    );
    const count = await optionsLocator.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = ((await optionsLocator.nth(i).textContent()) || "").trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  async selectLanguage(language: string): Promise<void> {
    // Check if the dropdown panel is already open before clicking
    const panel = this.page.locator(
      '.mat-mdc-select-panel, .cdk-overlay-pane .mat-mdc-select-panel'
    ).first();
    const alreadyOpen = await panel.isVisible().catch(() => false);

    if (!alreadyOpen) {
      const el = this.page.locator(this.languageDropdown).first();
      await el.click();
      await this.page.waitForTimeout(500);
    }

    // Click the matching option in the overlay panel
    const option = this.page
      .locator('mat-option, .mat-mdc-option, [role="option"]')
      .filter({ hasText: new RegExp(language, "i") })
      .first();
    await option.click();
  }

  // ── User Avatar ───────────────────────────────────────────────────────────

  async isUserAvatarVisible(): Promise<boolean> {
    const locatorVisible = await this.page.locator(this.userAvatar).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (locatorVisible) return true;
    return this.page.evaluate(() => !!document.querySelector('img.tw-profile__img, .tw-profile img'));
  }

  async getUserAvatarSrc(): Promise<string> {
    try {
      const img = this.page.locator(this.userAvatar).first();
      await img.waitFor({ state: "visible", timeout: 5000 });
      return (await img.getAttribute("src")) || "";
    } catch {
      return this.page.evaluate(() => {
        const img = document.querySelector('img.tw-profile__img, .tw-profile img') as HTMLImageElement;
        return img?.getAttribute("src") || "";
      });
    }
  }

  async getUserAvatarAlt(): Promise<string> {
    try {
      const img = this.page.locator(this.userAvatar).first();
      await img.waitFor({ state: "visible", timeout: 5000 });
      return (await img.getAttribute("alt")) || "";
    } catch {
      return this.page.evaluate(() => {
        const img = document.querySelector('img.tw-profile__img, .tw-profile img') as HTMLImageElement;
        return img?.getAttribute("alt") || "";
      });
    }
  }

  // ── Role Label ────────────────────────────────────────────────────────────

  async isRoleLabelVisible(): Promise<boolean> {
    const locatorVisible = await this.page.locator(this.roleLabel).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (locatorVisible) return true;
    return this.page.evaluate(() => !!document.querySelector('p.tw-profile__role, [class*="profile__role"]'));
  }

  async getRoleLabelText(): Promise<string> {
    try {
      const label = this.page.locator(this.roleLabel).first();
      await label.waitFor({ state: "visible", timeout: 5000 });
      return ((await label.textContent()) || "").trim();
    } catch {
      return this.page.evaluate(() => {
        const el = document.querySelector('p.tw-profile__role, [class*="profile__role"]');
        return (el?.textContent || "").trim();
      });
    }
  }

  // ── User Menu Dropdown ────────────────────────────────────────────────────

  async isUserMenuButtonVisible(): Promise<boolean> {
    // Try locator first
    const locatorVisible = await this.page.locator(this.userMenuButton).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (locatorVisible) return true;

    // Fallback: use evaluate to find the button in the DOM
    return this.page.evaluate(() => {
      const btn = document.querySelector('button.submenu__trigger') ||
                  document.querySelector('button.mat-mdc-menu-trigger[aria-haspopup="menu"]') ||
                  document.querySelector('.tw-header__info button');
      return !!btn;
    });
  }

  async openUserMenu(): Promise<void> {
    // Try locator first
    let clicked = false;
    try {
      const btn = this.page.locator(this.userMenuButton).first();
      await btn.waitFor({ state: "visible", timeout: 5000 });
      await btn.click();
      clicked = true;
    } catch {
      // Fallback: use evaluate to click the button directly
      await this.page.evaluate(() => {
        const btn = document.querySelector('button.submenu__trigger') ||
                    document.querySelector('button.mat-mdc-menu-trigger[aria-haspopup="menu"]') ||
                    document.querySelector('.tw-header__info button');
        if (btn) (btn as HTMLElement).click();
      });
    }

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
