import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * DashboardPage — main dashboard after login.
 * Provides access to dashboard widgets, stats, and data tables.
 *
 * DOM reference: Angular app with custom components and Angular Material.
 */
export class DashboardPage extends BasePage {
  // ── Selectors (verified against staging DOM) ────────────────────────────
  private readonly mainContent = 'main, [role="main"], .dashboard, .main-content, .content-wrapper, app-root';
  private readonly statsCards = '.stat-card, .stats-widget, [data-testid*="stat"], .dashboard-card';
  private readonly dataTable = 'table, .data-table, [data-testid*="table"], mat-table';
  private readonly searchInput = 'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]';
  private readonly loadingSpinner = '.loading, .spinner, [data-testid*="loading"], mat-spinner, mat-progress-spinner';

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate("/");
    await this.waitForReady();
  }

  // ── State ───────────────────────────────────────────────────────────────

  async isLoaded(): Promise<boolean> {
    const spinnerVisible = await this.isVisible(this.loadingSpinner);
    if (spinnerVisible) {
      await this.page.locator(this.loadingSpinner).first().waitFor({
        state: "hidden",
        timeout: 15000,
      });
    }
    return this.isVisible(this.mainContent);
  }

  // ── Stats ───────────────────────────────────────────────────────────────

  async getStatsCardCount(): Promise<number> {
    return this.page.locator(this.statsCards).count();
  }

  async getStatsCardsText(): Promise<string[]> {
    const cards = this.page.locator(this.statsCards);
    const count = await cards.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push((await cards.nth(i).textContent()) || "");
    }
    return texts;
  }

  // ── Data Table ──────────────────────────────────────────────────────────

  async getTableRowCount(): Promise<number> {
    const rows = this.page.locator(`${this.dataTable} tbody tr`);
    return rows.count();
  }

  async getTableCellText(row: number, col: number): Promise<string> {
    const cell = this.page.locator(
      `${this.dataTable} tbody tr:nth-child(${row + 1}) td:nth-child(${col + 1})`
    );
    return (await cell.textContent()) || "";
  }

  // ── Search ──────────────────────────────────────────────────────────────

  async search(query: string): Promise<void> {
    const input = this.page.locator(this.searchInput).first();
    await input.clear();
    await input.fill(query);
    await this.page.keyboard.press("Enter");
    await this.waitForReady();
  }

  // ── Assertions ──────────────────────────────────────────────────────────

  async expectDashboardLoaded(): Promise<void> {
    await expect(this.page.locator(this.mainContent).first()).toBeVisible({
      timeout: 15000,
    });
  }
}
