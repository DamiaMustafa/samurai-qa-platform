import { test, expect } from "../../src/fixtures";

/**
 * Smoke tests — critical path checks that should always pass.
 * These run quickly and verify the application is fundamentally working.
 */
test.describe("Critical Path @smoke", () => {
  test("staging site should be reachable", async ({ page, consoleErrors }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    // Should get a valid HTTP response (200 or redirect 3xx)
    expect(response!.status()).toBeLessThan(500);
    consoleErrors.assertNoErrors();
  });

  test("sign-in page should load", async ({ loginPage, consoleErrors }) => {
    await loginPage.goto();
    await loginPage.expectLoginPage();
    consoleErrors.assertNoErrors();
  });

  test("page should have a valid HTML structure", async ({ page, consoleErrors }) => {
    await page.goto("/sign-in");
    const html = await page.content();
    expect(html).toContain("<html");
    expect(html).toContain("</html>");
    consoleErrors.assertNoErrors();
  });

  test("page should load within reasonable time", async ({ page, consoleErrors }) => {
    const start = Date.now();
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    // Page should load within 15 seconds
    expect(loadTime).toBeLessThan(15000);
    consoleErrors.assertNoErrors();
  });

  test("page should be responsive (no console errors on load)", async ({
    page,
    consoleErrors,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");

    // Allow some errors but not critical ones
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("404") &&
        !e.includes("net::ERR_")
    );
    expect(criticalErrors).toHaveLength(0);

    // Also assert via the shared console error fixture
    consoleErrors.assertNoErrors();
  });
});
