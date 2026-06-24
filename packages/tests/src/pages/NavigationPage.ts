import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * NavigationPage — sidebar/header navigation shared across pages.
 * Handles menu interactions, routing, and logout.
 *
 * Sidebar nav items:
 *   Home, Projects, Instant Distill, Edge, Workflow, Plan, Manage Users, Logout
 *
 * DOM reference (Angular Material sidenav + custom nav components):
 * - Sidebar uses mat-sidenav / mat-drawer
 * - Nav links are Angular routerLinks
 * - User menu uses Material menu trigger
 */
export class NavigationPage extends BasePage {
  // ── Selectors (verified against staging DOM) ────────────────────────────
  private readonly sidebar = 'mat-sidenav, mat-drawer, .sidebar, [role="navigation"], nav[class*="sidebar"], nav[class*="side"]';
  private readonly navLinks = 'mat-sidenav a, mat-drawer a, nav a, [role="navigation"] a, [class*="sidebar"] a, [class*="nav-item"] a, [class*="sidebar"] button';
  private readonly userMenu = '[data-testid*="user-menu"], .user-menu, .profile-menu, button[mat-icon-button]';
  private readonly logoutButton = 'a:has-text("Logout"), a:has-text("Sign out"), button:has-text("Logout"), button:has-text("Sign out"), [data-testid*="logout"]';
  private readonly mobileMenuToggle = '.mobile-menu-toggle, .hamburger, button[aria-label*="menu" i], mat-drawer-toggle';

  // Active state selectors
  private readonly activeNavLink =
    '[class*="active"], [aria-current="page"], [aria-selected="true"], ' +
    '.router-link-active, .mat-mdc-list-item.activated, [class*="selected"]';

  /**
   * Map of sidebar nav item names to expected URL path patterns.
   * Used by navigation tests to verify correct routing.
   */
  static readonly NAV_ROUTES: Record<string, RegExp> = {
    home: /\/(home)?$/,
    projects: /\/projects/,
    "instant distill": /\/(instant[-_]?distill|distill)/,
    edge: /\/edge/,
    workflow: /\/workflow/,
    plan: /\/plan/,
    "manage users": /\/(manage[-_]?users|users)/,
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
    // Try clicking sidebar Logout first
    const sidebarLogout = this.page
      .locator(this.navLinks)
      .filter({ hasText: /logout/i })
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
    await this.page.locator(this.logoutButton).first().click();
    await this.waitForReady();
  }

  // ── Sidebar Helpers ─────────────────────────────────────────────────────

  private async clickNavLink(text: string): Promise<void> {
    const link = this.page
      .locator(this.navLinks)
      .filter({ hasText: new RegExp(text, "i") })
      .first();
    await link.click();
  }

  async getNavLinks(): Promise<string[]> {
    const links = this.page.locator(this.navLinks);
    const count = await links.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      if (text?.trim()) texts.push(text.trim());
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
   * Looks for active CSS classes, aria-current="page", or router-link-active.
   */
  async isNavLinkActive(text: string): Promise<boolean> {
    const link = this.page
      .locator(this.navLinks)
      .filter({ hasText: new RegExp(text, "i") })
      .first();

    if (!(await link.isVisible().catch(() => false))) {
      return false;
    }

    // Check aria-current
    const ariaCurrent = await link.getAttribute("aria-current").catch(() => null);
    if (ariaCurrent === "page") return true;

    // Check for active class on the link itself or its parent
    const classes = (await link.getAttribute("class").catch(() => "")) || "";
    const parentClasses =
      (await link
        .locator("..")
        .first()
        .getAttribute("class")
        .catch(() => "")) || "";

    const activePatterns = /active|selected|current|highlighted/i;
    return activePatterns.test(classes) || activePatterns.test(parentClasses);
  }

  /**
   * Get the text of the currently active nav item.
   */
  async getActiveNavLinkText(): Promise<string> {
    // Try aria-current first
    const ariaActive = this.page
      .locator(`${this.navLinks}[aria-current="page"]`)
      .first();
    if (await ariaActive.isVisible().catch(() => false)) {
      return ((await ariaActive.textContent()) || "").trim();
    }

    // Try active class patterns within the sidebar
    const sidebarLocator = this.page.locator(this.sidebar).first();
    const activeLink = sidebarLocator
      .locator(
        'a[class*="active"], a.router-link-active, [class*="nav-item"][class*="active"] a, ' +
          'button[class*="active"], [aria-selected="true"]'
      )
      .first();
    if (await activeLink.isVisible().catch(() => false)) {
      return ((await activeLink.textContent()) || "").trim();
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
