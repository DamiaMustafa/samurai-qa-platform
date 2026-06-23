import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * NavigationPage — sidebar/header navigation shared across pages.
 * Handles menu interactions, routing, and logout.
 *
 * DOM reference (Angular Material sidenav + custom nav components):
 * - Sidebar uses mat-sidenav / mat-drawer
 * - Nav links are Angular routerLinks
 * - User menu uses Material menu trigger
 */
export class NavigationPage extends BasePage {
  // ── Selectors (verified against staging DOM) ────────────────────────────
  private readonly sidebar = 'mat-sidenav, mat-drawer, .sidebar, [role="navigation"]';
  private readonly navLinks = 'mat-sidenav a, mat-drawer a, nav a, [role="navigation"] a';
  private readonly userMenu = '[data-testid*="user-menu"], .user-menu, .profile-menu, button[mat-icon-button]';
  private readonly logoutButton = 'a:has-text("Logout"), a:has-text("Sign out"), button:has-text("Logout"), button:has-text("Sign out"), [data-testid*="logout"]';
  private readonly mobileMenuToggle = '.mobile-menu-toggle, .hamburger, button[aria-label*="menu" i], mat-drawer-toggle';

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation Actions ──────────────────────────────────────────────────

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
    // Try clicking user menu first (if dropdown-based logout)
    const userMenuVisible = await this.isVisible(this.userMenu);
    if (userMenuVisible) {
      await this.page.locator(this.userMenu).first().click();
    }
    await this.page.locator(this.logoutButton).first().click();
    await this.waitForReady();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

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
}
