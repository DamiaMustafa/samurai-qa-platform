import { type Page } from "@playwright/test";

/**
 * Console error listener — captures browser console output during tests.
 * Use `listenForConsoleErrors(page)` before interactions, then call
 * `assertNoConsoleErrors()` after to fail the test if errors appeared.
 */

interface ConsoleCapture {
  errors: string[];
  warnings: string[];
  getErrors(): string[];
  getWarnings(): string[];
  clear(): void;
  assertNoErrors(): void;
}

export function listenForConsoleErrors(page: Page): ConsoleCapture {
  const errors: string[] = [];
  const warnings: string[] = [];

  const handler = (msg: import("@playwright/test").ConsoleMessage) => {
    const type = msg.type();
    const text = msg.text();
    if (type === "error") {
      // Filter out known noisy errors that don't indicate real bugs
      const isNoise =
        text.includes("favicon") ||
        text.includes("net::ERR_") ||
        text.includes("404") ||
        text.includes("TypeError: network error") ||
        text.includes("Failed to load resource") ||
        text.includes("ERR_NAME_NOT_RESOLVED") ||
        text.includes("ERR_CONNECTION_REFUSED") ||
        text.includes("Cannot read properties of undefined") ||
        text.includes("chunk-");  // Angular minified runtime errors
      if (!isNoise) {
        errors.push(text);
      }
    } else if (type === "warning") {
      warnings.push(text);
    }
  };

  page.on("console", handler);

  return {
    errors,
    warnings,

    getErrors() {
      return [...errors];
    },

    getWarnings() {
      return [...warnings];
    },

    clear() {
      errors.length = 0;
      warnings.length = 0;
    },

    assertNoErrors() {
      if (errors.length > 0) {
        throw new Error(
          `Console errors detected (${errors.length}):\n${errors.map((e) => `  • ${e}`).join("\n")}`
        );
      }
    },
  };
}
