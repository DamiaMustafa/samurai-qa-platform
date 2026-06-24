import { chromium } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";
import path from "path";
import fs from "fs";

dotenvConfig({ path: path.resolve(__dirname, "../.env") });

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const baseUrl = process.env.BASE_URL || "https://staging.visionsamur.ai";
  const context = await browser.newContext({ baseURL: baseUrl });
  const page = await context.newPage();

  const email = process.env.STAGING_EMAIL || "";
  const password = process.env.STAGING_PASSWORD || "";

  console.log(`\n🔍 DOM Inspector — targeting ${process.env.BASE_URL || "https://staging.visionsamur.ai"}\n`);

  // ── Step 1: Login ──────────────────────────────────────────────────────
  console.log("→ Navigating to sign-in page...");
  await page.goto("/sign-in", { waitUntil: "networkidle" });

  // Capture sign-in page selectors
  console.log("\n── SIGN-IN PAGE ──");
  const signInHTML = await page.content();

  // Find key elements
  const emailInput = await page.locator('input[type="email"]').first().getAttribute("id").catch(() => null) || "none";
  const emailInputClasses = await page.locator('input[type="email"]').first().getAttribute("class").catch(() => null) || "none";
  const emailInputParent = await page.locator('input[type="email"]').first().locator("..").getAttribute("class").catch(() => null) || "none";
  const emailInputParentID = await page.locator('input[type="email"]').first().locator("..").getAttribute("id").catch(() => null) || "none";
  console.log(`  email input id: ${emailInput}`);
  console.log(`  email input class: ${emailInputClasses}`);
  console.log(`  email parent class: ${emailInputParent}`);
  console.log(`  email parent id: ${emailInputParentID}`);

  // Error message element
  const errorEl = await page.locator('[class*="error"], [role="alert"], .welcome__login-error').first().getAttribute("class").catch(() => "not found");
  console.log(`  error element class: ${errorEl}`);

  // Login — type() sends individual keystrokes for Angular reactive forms
  console.log("\n→ Logging in...");
  const emailLoc = page.locator('#login-email input[type="email"], input#login-email, input[type="email"]').first();
  await emailLoc.click();
  await emailLoc.pressSequentially(email, { delay: 30 });

  const passLoc = page.locator('#login-password input, input#login-password, input[type="password"]').first();
  await passLoc.click();
  await passLoc.pressSequentially(password, { delay: 30 });

  // Wait for Angular to validate and enable button
  await page.waitForTimeout(3000);

  // Check if button is enabled
  const isDisabled = await page.locator('#login-sign-in-button').isDisabled();
  console.log(`  Button disabled after typing: ${isDisabled}`);

  if (isDisabled) {
    // Force-enable via JS if Angular is stubborn
    await page.evaluate(() => {
      const btn = document.querySelector('#login-sign-in-button') as HTMLButtonElement;
      if (btn) btn.disabled = false;
    });
  }

  await page.locator('#login-sign-in-button').click();
  await page.waitForLoadState("networkidle");

  // Wait for loading overlay to clear
  await page.waitForTimeout(5000);
  await page.waitForLoadState("networkidle");

  const currentUrl = page.url();
  console.log(`  Current URL: ${currentUrl}`);

  // ── Step 2: Capture full page HTML structure ────────────────────────────────
  console.log("\n── HOME PAGE STRUCTURE ──");

  // Save full page HTML
  const homeHTML = await page.content();
  fs.writeFileSync("dom-inspect-home.html", homeHTML);
  console.log("  Saved full HTML to dom-inspect-home.html");

  // Get the body's direct children structure
  const bodyStructure = await page.evaluate(() => {
    function getStructure(el: Element, depth: number = 0): string {
      if (depth > 4) return "";
      const tag = el.tagName.toLowerCase();
      const id = el.id ? `#${el.id}` : "";
      const classes = el.className && typeof el.className === "string"
        ? `.${el.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".")}`
        : "";
      const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? ` "${(el.textContent || "").trim().substring(0, 30)}"`
        : "";
      const indent = "  ".repeat(depth);
      let result = `${indent}<${tag}${id}${classes}>${text}\n`;
      for (const child of Array.from(el.children).slice(0, 10)) {
        result += getStructure(child, depth + 1);
      }
      return result;
    }
    return getStructure(document.body);
  });
  console.log("\n  Body structure:");
  console.log(bodyStructure);

  // ── Step 3: Sidebar ────────────────────────────────────────────────────
  console.log("\n── SIDEBAR ──");
  const sidebarInfo = await page.evaluate(() => {
    // Find sidebar-like elements
    const selectors = [
      'nav', 'aside', '[role="navigation"]', '[class*="sidebar"]',
      '[class*="side-bar"]', '[class*="sidenav"]', '[class*="drawer"]',
      'mat-sidenav', 'mat-drawer', '[class*="menu"]'
    ];
    const results: string[] = [];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      els.forEach(el => {
        const links = el.querySelectorAll('a, button');
        if (links.length >= 3) {
          const linkTexts = Array.from(links).map(l => {
            const text = (l.textContent || "").trim();
            const href = l.getAttribute("href") || "";
            const cls = l.className || "";
            return `    <${l.tagName.toLowerCase()} href="${href}" class="${cls}">"${text}"`;
          });
          results.push(`  Found: <${el.tagName.toLowerCase()} class="${el.className}" id="${el.id}">`);
          results.push(linkTexts.join("\n"));
        }
      });
    }
    return results.join("\n");
  });
  console.log(sidebarInfo || "  No sidebar found with standard selectors");

  // ── Step 4: All links and buttons with their text ──────────────────────
  console.log("\n── ALL NAV-LIKE LINKS ──");
  const allLinks = await page.evaluate(() => {
    const links = document.querySelectorAll("a[href], button");
    return Array.from(links).map(l => {
      const text = (l.textContent || "").trim().substring(0, 40);
      const href = l.getAttribute("href") || "";
      const cls = (l.className || "").toString().substring(0, 80);
      const tag = l.tagName.toLowerCase();
      const ariaLabel = l.getAttribute("aria-label") || "";
      return `  <${tag} href="${href}" class="${cls}" aria-label="${ariaLabel}">"${text}"`;
    }).filter(l => l.includes('"') && !l.includes('""')).join("\n");
  });
  console.log(allLinks);

  // ── Step 5: Header area ────────────────────────────────────────────────
  console.log("\n── HEADER / TOP BAR ──");
  const headerInfo = await page.evaluate(() => {
    const selectors = [
      'header', '[class*="header"]', '[class*="topbar"]', '[class*="top-bar"]',
      '[class*="navbar"]', '[class*="app-bar"]', 'mat-toolbar'
    ];
    const results: string[] = [];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      els.forEach(el => {
        results.push(`  Found: <${el.tagName.toLowerCase()} class="${el.className}" id="${el.id}">`);
        // Get inner structure
        const children = el.querySelectorAll("*");
        children.forEach(child => {
          const tag = child.tagName.toLowerCase();
          const cls = (child.className || "").toString().substring(0, 60);
          const text = (child.textContent || "").trim().substring(0, 30);
          const ariaLabel = child.getAttribute("aria-label") || "";
          const src = child.getAttribute("src") || "";
          if (tag === "img" || tag === "button" || tag === "a" || tag === "select" || ariaLabel) {
            results.push(`    <${tag} class="${cls}" aria-label="${ariaLabel}" src="${src}">"${text}"`);
          }
        });
      });
    }
    return results.join("\n");
  });
  console.log(headerInfo || "  No header found");

  // ── Step 6: Project cards ──────────────────────────────────────────────
  console.log("\n── RECENT PROJECTS / CARDS ──");
  const cardsInfo = await page.evaluate(() => {
    // Look for "Recent Projects" text
    const allElements = document.querySelectorAll("*");
    for (const el of Array.from(allElements)) {
      if (el.children.length === 0 && (el.textContent || "").includes("Recent Projects")) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className || "";
        const parent = el.parentElement;
        const parentTag = parent?.tagName.toLowerCase() || "";
        const parentCls = parent?.className || "";
        const grandParent = parent?.parentElement;
        const gpTag = grandParent?.tagName.toLowerCase() || "";
        const gpCls = grandParent?.className || "";
        console.log(`  Found heading: <${tag} class="${cls}"> in <${parentTag} class="${parentCls}"> in <${gpTag} class="${gpCls}">`);
      }
    }

    // Look for card-like elements
    const cardSelectors = [
      '[class*="card"]', '[class*="project"]', '[class*="item"]',
      'li', '[class*="grid"] > *'
    ];
    const results: string[] = [];
    for (const sel of cardSelectors) {
      const els = document.querySelectorAll(sel);
      if (els.length >= 1 && els.length <= 10) {
        els.forEach((el, i) => {
          if (i < 3) {
            const cls = (el.className || "").toString().substring(0, 80);
            const text = (el.textContent || "").trim().substring(0, 60);
            results.push(`  [${sel}] <${el.tagName.toLowerCase()} class="${cls}">"${text}"`);
          }
        });
      }
    }
    return results.join("\n");
  });
  console.log(cardsInfo || "  No cards found");

  // ── Step 7: Language selector ──────────────────────────────────────────
  console.log("\n── LANGUAGE SELECTOR ──");
  const langInfo = await page.evaluate(() => {
    const selectors = [
      'select', '[role="combobox"]', '[class*="lang"]', '[class*="locale"]',
      '[class*="language"]', '[class*="i18n"]', 'button[class*="lang"]',
      '[class*="translate"]'
    ];
    const results: string[] = [];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      els.forEach(el => {
        const cls = (el.className || "").toString().substring(0, 80);
        const text = (el.textContent || "").trim().substring(0, 40);
        results.push(`  Found: <${el.tagName.toLowerCase()} class="${cls}">"${text}"`);
      });
    }
    return results.join("\n");
  });
  console.log(langInfo || "  No language selector found");

  // ── Step 8: User avatar & role ─────────────────────────────────────────
  console.log("\n── AVATAR & ROLE ──");
  const avatarInfo = await page.evaluate(() => {
    const selectors = [
      'img[class*="avatar"]', '[class*="avatar"]', 'img[class*="profile"]',
      '[class*="profile-pic"]', '[class*="user-image"]', 'img[src*="avatar"]',
      '[class*="user"]', '[class*="role"]', '[class*="badge"]'
    ];
    const results: string[] = [];
    for (const sel of selectors) {
      const els = document.querySelectorAll(sel);
      els.forEach(el => {
        const cls = (el.className || "").toString().substring(0, 80);
        const text = (el.textContent || "").trim().substring(0, 40);
        const src = el.getAttribute("src") || "";
        results.push(`  Found: <${el.tagName.toLowerCase()} class="${cls}" src="${src}">"${text}"`);
      });
    }
    return results.join("\n");
  });
  console.log(avatarInfo || "  No avatar/role elements found");

  // ── Step 9: Console errors during the session ─────────────────────────
  console.log("\n── CONSOLE ERRORS DURING SESSION ──");
  // Already captured during the run

  await browser.close();
  console.log("\n✅ DOM inspection complete. Check dom-inspect-home.html for full HTML.");
}

inspect().catch(console.error);
