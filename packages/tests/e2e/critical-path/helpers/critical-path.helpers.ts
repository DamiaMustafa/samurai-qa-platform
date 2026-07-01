import { expect } from "@playwright/test";

/**
 * Critical-path console error helper.
 *
 * Filters out known harmless console patterns that are noise in Angular apps,
 * then asserts no real errors remain. Use after critical pipeline steps:
 * project create, dataset upload, training start, deploy.
 */

const IGNORED_ERRORS: RegExp[] = [
  /ExpressionChangedAfterItHasBeenCheckedError/,
  /ResizeObserver loop/,
  /favicon/,
  /analytics/,
  /telemetry/,
  // Additional noise from the existing console-error-helper
  /net::ERR_/,
  /404/,
  /TypeError: network error/,
  /Failed to load resource/,
  /ERR_NAME_NOT_RESOLVED/,
  /ERR_CONNECTION_REFUSED/,
  /report-only/,
  /chunk-/,
];

/**
 * Assert that no *real* console errors were captured.
 * Filters out known harmless patterns before asserting.
 *
 * @param errors — array of error strings from `consoleErrors.getErrors()`
 */
export function assertNoRealConsoleErrors(errors: string[]): void {
  const real = errors.filter(
    (e) => !IGNORED_ERRORS.some((p) => p.test(e))
  );
  if (real.length > 0) {
    throw new Error(
      `Real console errors detected (${real.length}):\n${real
        .map((e) => `  • ${e}`)
        .join("\n")}`
    );
  }
}

/**
 * Console capture interface — matches the shape returned by
 * `listenForConsoleErrors(page)` from src/helpers/console-error-helper.ts.
 */
export interface ConsoleCapture {
  errors: string[];
  warnings: string[];
  getErrors(): string[];
  getWarnings(): string[];
  clear(): void;
  assertNoErrors(): void;
}

/**
 * Assert no real console errors using a ConsoleCapture object.
 * Clears the capture after assertion for the next checkpoint.
 */
export function assertCheckpoint(capture: ConsoleCapture): void {
  assertNoRealConsoleErrors(capture.getErrors());
  capture.clear();
}
