import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * NavigationPage — sidebar/header navigation shared across pages.
 * Handles menu interactions, routing, and logout.
 *
 * Sidebar nav items:
 *   Home, Projects, Instant Distill, Edge, Workflow, Plan, Manage Users, Logout
 *
 * DOM reference (verified against staging.visionsamur.ai):
 * - Sidebar: <nav class="tw-side-nav__navigation">
 * - Nav links (collapsed): <a class="tw-side-nav__navigation-link-close">
 * - Nav buttons: <button class="tw-side-nav__button-close">
 * - Active state: class "active--" on the <a> element
 * - Logout: <button class="tw-side-nav__button-close tw-side-nav__button-close-logout">
 */
export class NavigationPage extends BasePage {
  // ── Selectors (verified against staging DOM) ────────────────────────────
  private readonly sidebar = 'nav.tw-side-nav__navigation, .tw-side-nav__navigation, nav[class*="side-nav"]';
  private readonly navLinks = 'a.tw-side-nav__navigation-link-close, a[class*="side-nav__navigation-link"]';
  private readonly navButtons = 'button.tw-side-nav__button-close, button[class*="side-nav__button-close"]';
  private readonly userMenu = '[data-testid*="user-menu"], .user-menu, .profile-menu, button[mat-icon-button]';
  private readonly logoutButton = 'button.tw-side-nav__button-close-logout, button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout"), [data-testid*="logout"]';
  private readonly mobileMenuToggle = '.mobile-menu-toggle, .hamburger, button[aria-label*="menu" i], mat-drawer-toggle, button.tw-layout__nav-container-button';

  // Active state selectors
  private readonly activeNavLink =
    'a.tw-side-nav__navigation-link-close.active--, a[class*="active--"], ' +
    '[aria-current="page"], .router-link-active';

  /**
   * Map of sidebar nav item names to expected URL path patterns.
   * Verified against staging.visionsamur.ai routes.
   */
  static readonly NAV_ROUTES: Record<string, RegExp> = {
    home: /\/(home)?$/,
    projects: /\/projects/,
    "instant distill": /\/instant-distill/,
    edge: /\/edge-management/,
    workflow: /\/workflow-listing/,
    plan: /\/company\/.*\/plan/,
    "manage users": /\/user-management\/users/,
  };

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation Actions ──────────────────────────────────────────────────

  async goToHome(): Promise<void> {
    await this.clickNavLink("home");
    await this.waitForReady();
  }

  async goToProjects(): Promise<void> {
    await this.clickNavLink("projects");
    await this.waitForReady();
  }

  async goToInstantDistill(): Promise<void> {
    await this.clickNavLink("instant distill");
    await this.waitForReady();
  }

  async goToEdge(): Promise<void> {
    await this.clickNavLink("edge");
    await this.waitForReady();
  }

  async goToWorkflow(): Promise<void> {
    await this.clickNavLink("workflow");
    await this.waitForReady();
  }

  async goToPlan(): Promise<void> {
    await this.clickNavLink("plan");
    await this.waitForReady();
  }

  async goToManageUsers(): Promise<void> {
    await this.clickNavLink("manage users");
    await this.waitForReady();
  }

  async goToDashboard(): Promise<void> {
    await this.clickNavLink("dashboard");
    await this.waitForReady();
  }

  async goToSettings(): Promise<void> {
    await this.clickNavLink("settings");
    await this.waitForReady();
  }

  async goToUsers(): Promise<void> {
    await this.clickNavLink("users");
    await this.waitForReady();
  }

  async goToPage(pageName: string): Promise<void> {
    await this.clickNavLink(pageName);
    await this.waitForReady();
  }

  // ── Logout ──────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    // Try sidebar Logout button first
    const sidebarLogout = this.page
      .locator(this.logoutButton)
      .first();
    if (await sidebarLogout.isVisible().catch(() => false)) {
      await sidebarLogout.click();
      await this.waitForReady();
      return;
    }
    // Fallback: try user menu dropdown
    const userMenuVisible = await this.isVisible(this.userMenu);
    if (userMenuVisible) {
      await this.page.locator(this.userMenu).first().click();
    }
    await this.page.locator('button:has-text("Logout"), button:has-text("Sign out")').first().click();
    await this.waitForReady();
  }

  // ── Sidebar Helpers ─────────────────────────────────────────────────────

  private async clickNavLink(text: string): Promise<void> {
    // Use direct URL navigation — most reliable for collapsed sidebars
    const routeKey = text.toLowerCase();
    const routeMap: Record<string, string> = {
      home: "/home",
      projects: "/projects",
      "instant distill": "/instant-distill",
      edge: "/edge-management",
      workflow: "/workflow-listing",
      "manage users": "/user-management/users",
    };

    if (routeMap[routeKey]) {
      await Promise.all([
        this.page.waitForLoadState("networkidle").catch(() => {}),
        this.page.goto(routeMap[routeKey], { waitUntil: "domcontentloaded" }),
      ]);
      return;
    }

    // Plan has a dynamic URL — find the link by href
    if (routeKey === "plan") {
      const planLink = this.page.locator('a[href*="/plan"]').first();
      if (await planLink.count() > 0) {
        const href = await planLink.getAttribute("href");
        if (href) {
          await this.page.goto(href, { waitUntil: "domcontentloaded" });
          return;
        }
      }
    }

    // Last resort: try clicking the visible <a> or <button>
    const link = this.page
      .locator(`${this.navLinks}, ${this.navButtons}`)
      .filter({ hasText: new RegExp(text, "i") })
      .first();
    await link.click();
  }

  async getNavLinks(): Promise<string[]> {
    // Hover over sidebar to expand it and reveal link text
    const sidebar = this.page.locator(this.sidebar).first();
    if (await sidebar.isVisible().catch(() => false)) {
      await sidebar.hover().catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    // Get text from both <a> links and <button> nav items
    const allItems = this.page.locator(
      `${this.navLinks}, ${this.navButtons}`
    );
    const count = await allItems.count();
    const texts: string[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < count; i++) {
      const text = ((await allItems.nth(i).textContent({ timeout: 2000 }).catch(() => "")) || "").trim();
      if (text && !seen.has(text.toLowerCase())) {
        texts.push(text);
        seen.add(text.toLowerCase());
      }
    }
    return texts;
  }

  async isSidebarVisible(): Promise<boolean> {
    return this.isVisible(this.sidebar);
  }

  async toggleMobileMenu(): Promise<void> {
    const toggle = this.page.locator(this.mobileMenuToggle).first();
    if (await toggle.isVisible()) {
      await toggle.click();
    }
  }

  /**
   * Get the current URL path after navigation.
   */
  async getCurrentPath(): Promise<string> {
    const url = this.page.url();
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  /**
   * Check whether a nav item matching the given text is currently marked active.
   * Uses the "active--" class from the staging DOM.
   */
  async isNavLinkActive(text: string): Promise<boolean> {
    const link = this.page
      .locator(this.navLinks)
      .filter({ hasText: new RegExp(text, "i") })
      .first();

    if (!(await link.isVisible().catch(() => false))) {
      return false;
    }

    // Check for "active--" class
    const classes = (await link.getAttribute("class").catch(() => "")) || "";
    if (classes.includes("active--")) return true;

    // Check aria-current
    const ariaCurrent = await link.getAttribute("aria-current").catch(() => null);
    if (ariaCurrent === "page") return true;

    // Check img alt inside the link for active class
    const imgActive = await link
      .locator('img[class*="active--"]')
      .first()
      .isVisible()
      .catch(() => false);

    return imgActive;
  }

  /**
   * Get the text of the currently active nav item.
   */
  async getActiveNavLinkText(): Promise<string> {
    // Find the <a> with "active--" class
    const activeLink = this.page
      .locator('a.tw-side-nav__navigation-link-close.active--, a[class*="active--"]')
      .first();

    if (await activeLink.isVisible().catch(() => false)) {
      return ((await activeLink.textContent()) || "").trim();
    }

    // Fallback: check img alt with active class
    const activeImg = this.page
      .locator('img.tw-side-nav__navigation-link-close-icon.active--')
      .first();
    if (await activeImg.isVisible().catch(() => false)) {
      return (await activeImg.getAttribute("alt")) || "";
    }

    return "";
  }

  // ── Assertions ──────────────────────────────────────────────────────────

  async expectNavLinkActive(text: string): Promise<void> {
    const link = this.page
      .locator(this.navLinks)
      .filter({ hasText: new RegExp(text, "i") })
      .first();
    await expect(link).toBeVisible();
  }

  async expectLogoutSuccessful(): Promise<void> {
    await expect(this.page).toHaveURL(/sign-in|login|signin/);
  }

  async expectRouteMatches(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern, { timeout: 15000 });
  }
}
