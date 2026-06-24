import { test, expect } from "../src/fixtures";
import { envConfig } from "../src/config/environments";
import fs from "fs";
import path from "path";

/**
 * DOM Inspector — runs as a Playwright test to leverage existing login fixtures.
 * Captures real HTML structure of the staging app for selector tuning.
 * Run with: npx playwright test dom-inspect.spec.ts --headed
 */
test.describe("DOM Inspector @inspect", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured"
  );

  test("capture home page DOM structure", async ({ loginPage, page }) => {
    // Login using the proven fixture
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked: ${error}`);

    // Wait for home page to fully load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.waitForLoadState("networkidle");

    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);

    // Save full HTML
    const html = await page.content();
    const outDir = path.resolve(__dirname, "../dom-inspect-output");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "home-full.html"), html);
    console.log("  Saved full HTML to dom-inspect-output/home-full.html");

    // ── SIDEBAR ──
    console.log("\n── SIDEBAR ──");
    const sidebarInfo = await page.evaluate(() => {
      const results: string[] = [];
      const allNav = document.querySelectorAll(
        'nav, aside, [role="navigation"], [class*="sidebar"], [class*="side-bar"], [class*="sidenav"], [class*="drawer"], [class*="menu-panel"], [class*="left-nav"]'
      );
      allNav.forEach((el) => {
        results.push(`\n  Element: <${el.tagName.toLowerCase()} class="${el.className}" id="${el.id || ""}">`);
        const links = el.querySelectorAll("a, button");
        links.forEach((link) => {
          const text = (link.textContent || "").trim().substring(0, 50);
          const href = link.getAttribute("href") || "";
          const cls = (link.className || "").toString().substring(0, 100);
          const ariaLabel = link.getAttribute("aria-label") || "";
          const ariaCurrent = link.getAttribute("aria-current") || "";
          const isActive = link.classList.toString().includes("active") || link.classList.toString().includes("selected");
          results.push(
            `    <${link.tagName.toLowerCase()} href="${href}" class="${cls}" aria-label="${ariaLabel}" aria-current="${ariaCurrent}" active=${isActive}>"${text}"`
          );
        });
      });

      // Also check for any element containing nav-like link groups
      const allAnchors = document.querySelectorAll("a[href]");
      const hrefGroups: Record<string, string[]> = {};
      allAnchors.forEach((a) => {
        const parent = a.parentElement;
        if (parent) {
          const key = `${parent.tagName}.${parent.className.toString().substring(0, 50)}`;
          if (!hrefGroups[key]) hrefGroups[key] = [];
          hrefGroups[key].push(`${(a.textContent || "").trim().substring(0, 30)} → ${a.getAttribute("href")}`);
        }
      });
      for (const [parent, links] of Object.entries(hrefGroups)) {
        if (links.length >= 4) {
          results.push(`\n  Link group in <${parent}>:`);
          links.forEach((l) => results.push(`    ${l}`));
        }
      }

      return results.join("\n");
    });
    console.log(sidebarInfo || "  No sidebar found");

    // ── HEADER / TOP BAR ──
    console.log("\n── HEADER ──");
    const headerInfo = await page.evaluate(() => {
      const results: string[] = [];
      const headers = document.querySelectorAll(
        'header, [class*="header"], [class*="topbar"], [class*="top-bar"], [class*="navbar"], [class*="app-bar"], mat-toolbar'
      );
      headers.forEach((el) => {
        results.push(`\n  Element: <${el.tagName.toLowerCase()} class="${el.className}" id="${el.id || ""}">`);
        // Get all interactive children
        const interactives = el.querySelectorAll("button, a, select, input, img, [role]");
        interactives.forEach((child) => {
          const tag = child.tagName.toLowerCase();
          const cls = (child.className || "").toString().substring(0, 80);
          const text = (child.textContent || "").trim().substring(0, 40);
          const ariaLabel = child.getAttribute("aria-label") || "";
          const src = child.getAttribute("src") || "";
          const href = child.getAttribute("href") || "";
          const role = child.getAttribute("role") || "";
          const id = child.id || "";
          results.push(
            `    <${tag} id="${id}" class="${cls}" role="${role}" aria-label="${ariaLabel}" href="${href}" src="${src.substring(0, 60)}">"${text}"`
          );
        });
      });
      return results.join("\n");
    });
    console.log(headerInfo || "  No header found");

    // ── ALL IMAGES ──
    console.log("\n── IMAGES ──");
    const imgInfo = await page.evaluate(() => {
      const imgs = document.querySelectorAll("img");
      return Array.from(imgs)
        .map((img) => {
          const src = (img.getAttribute("src") || "").substring(0, 80);
          const alt = img.getAttribute("alt") || "";
          const cls = (img.className || "").substring(0, 80);
          const parent = img.parentElement;
          const parentCls = parent ? (parent.className || "").toString().substring(0, 60) : "";
          const parentTag = parent ? parent.tagName.toLowerCase() : "";
          return `  <img class="${cls}" alt="${alt}" src="${src}"> in <${parentTag} class="${parentCls}">`;
        })
        .join("\n");
    });
    console.log(imgInfo || "  No images found");

    // ── SELECTS / COMBOBOXES / DROPDOWNS ──
    console.log("\n── SELECTS / DROPDOWNS ──");
    const selectInfo = await page.evaluate(() => {
      const results: string[] = [];
      const selects = document.querySelectorAll(
        'select, [role="combobox"], [role="listbox"], [class*="dropdown"], [class*="select"], [class*="lang"], [class*="locale"]'
      );
      selects.forEach((el) => {
        const tag = el.tagName.toLowerCase();
        const cls = (el.className || "").toString().substring(0, 80);
        const text = (el.textContent || "").trim().substring(0, 40);
        const role = el.getAttribute("role") || "";
        const ariaLabel = el.getAttribute("aria-label") || "";
        results.push(`  <${tag} class="${cls}" role="${role}" aria-label="${ariaLabel}">"${text}"`);
      });
      return results.join("\n");
    });
    console.log(selectInfo || "  No selects/dropdowns found");

    // ── RECENT PROJECTS / CARDS ──
    console.log("\n── RECENT PROJECTS / CARDS ──");
    const cardsInfo = await page.evaluate(() => {
      const results: string[] = [];
      // Find "Recent Projects" heading
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const text = (walker.currentNode.textContent || "").trim();
        if (text.includes("Recent Project") || text.includes("recent project")) {
          const parent = walker.currentNode.parentElement;
          if (parent) {
            results.push(
              `  Heading: <${parent.tagName.toLowerCase()} class="${parent.className}"> in parent <${parent.parentElement?.tagName.toLowerCase()} class="${parent.parentElement?.className}">`
            );
            // Get siblings and parent's children
            const container = parent.parentElement;
            if (container) {
              Array.from(container.children).forEach((child, i) => {
                if (i < 5) {
                  results.push(
                    `    child[${i}]: <${child.tagName.toLowerCase()} class="${(child.className || "").toString().substring(0, 80)}">"${(child.textContent || "").trim().substring(0, 60)}"`
                  );
                }
              });
            }
          }
        }
      }

      // Find card-like elements
      const cards = document.querySelectorAll(
        '[class*="card"], [class*="project"], [class*="item-card"], [class*="grid-item"]'
      );
      if (cards.length > 0 && cards.length <= 10) {
        results.push(`\n  Found ${cards.length} card-like elements:`);
        Array.from(cards).forEach((card, i) => {
          if (i < 3) {
            const cls = (card.className || "").toString().substring(0, 80);
            results.push(`\n    Card[${i}]: <${card.tagName.toLowerCase()} class="${cls}">`);
            Array.from(card.children).forEach((child) => {
              const cTag = child.tagName.toLowerCase();
              const cCls = (child.className || "").toString().substring(0, 60);
              const cText = (child.textContent || "").trim().substring(0, 40);
              const cSrc = child.getAttribute("src") || "";
              results.push(`      <${cTag} class="${cCls}" src="${cSrc}">"${cText}"`);
            });
          }
        });
      }
      return results.join("\n");
    });
    console.log(cardsInfo || "  No cards/projects found");

    // ── BUTTONS WITH SPECIAL ATTRIBUTES ──
    console.log("\n── BUTTONS ──");
    const btnInfo = await page.evaluate(() => {
      const btns = document.querySelectorAll("button");
      return Array.from(btns)
        .map((btn) => {
          const text = (btn.textContent || "").trim().substring(0, 40);
          const cls = (btn.className || "").substring(0, 80);
          const ariaLabel = btn.getAttribute("aria-label") || "";
          const ariaHaspopup = btn.getAttribute("aria-haspopup") || "";
          const id = btn.id || "";
          const twButton = btn.getAttribute("tw-button") || "";
          return `  <button id="${id}" class="${cls}" tw-button="${twButton}" aria-label="${ariaLabel}" aria-haspopup="${ariaHaspopup}">"${text}"`;
        })
        .join("\n");
    });
    console.log(btnInfo || "  No buttons found");

    // ── CONSOLE ERRORS ──
    console.log("\n── CUSTOM ELEMENTS / WEB COMPONENTS ──");
    const customInfo = await page.evaluate(() => {
      const all = document.querySelectorAll("*");
      const customTags = new Set<string>();
      all.forEach((el) => {
        if (el.tagName.includes("-")) customTags.add(el.tagName.toLowerCase());
      });
      return `  Custom elements: ${Array.from(customTags).join(", ")}`;
    });
    console.log(customInfo);

    // ── PROJECT CARDS (deep inspect) ──
    console.log("\n── PROJECT CARDS (deep) ──");
    const deepCards = await page.evaluate(() => {
      const results: string[] = [];
      const listing = document.querySelector("sc-project-cards-listing");
      if (listing) {
        const root = listing.shadowRoot || listing;
        const children = root.querySelectorAll("*");
        results.push(`  sc-project-cards-listing: ${children.length} descendants, shadowRoot: ${!!listing.shadowRoot}`);
        Array.from(children).slice(0, 50).forEach((el, i) => {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className || "").toString().substring(0, 80);
          const text = (el.textContent || "").trim().substring(0, 50);
          const src = el.getAttribute("src") || "";
          const href = el.getAttribute("href") || "";
          results.push(`    [${i}] <${tag} class="${cls}" src="${src.substring(0, 60)}" href="${href}">"${text}"`);
        });
      } else {
        results.push("  No sc-project-cards-listing found");
      }
      return results.join("\n");
    });
    console.log(deepCards);

    // ── USER MENU DROPDOWN (click to open, then inspect) ──
    console.log("\n── USER MENU DROPDOWN ──");
    const menuBtn = page.locator("button.mat-mdc-menu-trigger.submenu__trigger").first();
    await menuBtn.click();
    await page.waitForTimeout(1500);

    const menuInfo = await page.evaluate(() => {
      const results: string[] = [];
      const menus = document.querySelectorAll(
        '[role="menu"], .mat-mdc-menu-panel, .mat-mdc-menu-content, mat-menu, .cdk-overlay-pane'
      );
      menus.forEach((menu) => {
        results.push(`  Menu: <${menu.tagName.toLowerCase()} class="${menu.className}">`);
        const items = menu.querySelectorAll('[role="menuitem"], button, a, .mat-mdc-menu-item');
        items.forEach((item, i) => {
          const tag = item.tagName.toLowerCase();
          const cls = (item.className || "").toString().substring(0, 80);
          const text = (item.textContent || "").trim().substring(0, 40);
          results.push(`    [${i}] <${tag} class="${cls}">"${text}"`);
        });
      });
      return results.join("\n");
    });
    console.log(menuInfo || "  No menu overlay found");

    // Close menu
    await page.locator("body").click({ position: { x: 0, y: 0 } });
    await page.waitForTimeout(500);

    // ── ROLE / USERNAME TEXT ──
    console.log("\n── ROLE / USERNAME ──");
    const roleInfo = await page.evaluate(() => {
      const results: string[] = [];
      const profile = document.querySelector("tw-profile, .tw-header__profile, .tw-profile");
      if (profile) {
        results.push(`  Profile element: <${profile.tagName.toLowerCase()} class="${profile.className}">`);
        const all = profile.querySelectorAll("*");
        all.forEach((el) => {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className || "").toString().substring(0, 60);
          const text = (el.textContent || "").trim().substring(0, 50);
          if (text) results.push(`    <${tag} class="${cls}">"${text}"`);
        });
      }
      // Also look for role-like text
      const roleEls = document.querySelectorAll('[class*="role"], [class*="username"], [class*="user-name"]');
      roleEls.forEach((el) => {
        results.push(`  Role: <${el.tagName.toLowerCase()} class="${el.className}">"${(el.textContent || "").trim()}"`);
      });
      return results.join("\n");
    });
    console.log(roleInfo || "  No role/username elements found");

    // This test always passes — it's just for inspection
    expect(true).toBe(true);
  });
});
