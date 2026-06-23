import {
  type Reporter,
  type FullConfig,
  type Suite,
  type TestCase,
  type TestResult,
  type FullResult,
} from "@playwright/test/reporter";
import { randomUUID } from "crypto";
import type {
  TestResult as SharedTestResult,
  TestStepInfo,
} from "@samurai-qa/shared";
import { envConfig } from "../config/environments";

/**
 * DashboardReporter — posts test results to the QA Dashboard API.
 *
 * Lifecycle:
 * 1. onBegin: Creates a TestRun record via POST /api/runs
 * 2. onTestEnd: Collects results into memory
 * 3. onEnd: POSTs all results via POST /api/results, then PATCHes run status
 */
export default class DashboardReporter implements Reporter {
  private runId: string;
  private results: SharedTestResult[] = [];
  private dashboardUrl: string;
  private startTime: Date = new Date();

  constructor() {
    this.runId = process.env.TEST_RUN_ID || randomUUID();
    this.dashboardUrl = envConfig.dashboardApiUrl;
  }

  async onBegin(config: FullConfig, suite: Suite): Promise<void> {
    this.startTime = new Date();
    console.log(`\n🔗 Dashboard Reporter — Run ID: ${this.runId}`);

    try {
      await this.postWithRetry(`${this.dashboardUrl}/runs`, {
        id: this.runId,
        trigger: process.env.CI ? "ci" : "manual",
        suite: process.env.TEST_SUITE || null,
        status: "running",
        totalTests: this.countTests(suite),
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        startedAt: this.startTime.toISOString(),
      });
      console.log("✅ Run registered with dashboard");
    } catch (error) {
      console.warn(
        "⚠️  Could not register run with dashboard (is it running?):",
        (error as Error).message
      );
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const steps: TestStepInfo[] = result.steps.map((step) => ({
      title: step.title,
      status: step.error ? "failed" : "passed",
      duration: step.duration,
      error: step.error?.message || null,
      startTime: step.startTime?.toISOString() || new Date().toISOString(),
    }));

    const screenshots: string[] = result.attachments
      .filter(
        (a) =>
          a.contentType === "image/png" || a.contentType === "image/jpeg"
      )
      .map((a) => a.path || "")
      .filter(Boolean);

    const errors: string[] = [];
    if (result.error) {
      errors.push(result.error.message || "Unknown error");
    }
    for (const step of result.steps) {
      if (step.error) {
        errors.push(`${step.title}: ${step.error.message || "Unknown error"}`);
      }
    }

    const testResult: SharedTestResult = {
      runId: this.runId,
      suiteName: test.parent?.title || "default",
      testName: test.title,
      status: this.mapStatus(result.status),
      duration: result.duration,
      retries: result.retry,
      steps,
      errors,
      screenshots,
      videoPath: result.attachments.find((a) => a.contentType === "video/webm")
        ?.path || null,
      startedAt: result.startTime.toISOString(),
      completedAt: new Date(
        result.startTime.getTime() + result.duration
      ).toISOString(),
    };

    this.results.push(testResult);
  }

  async onEnd(result: FullResult): Promise<void> {
    const duration = Date.now() - this.startTime.getTime();
    const passed = this.results.filter((r) => r.status === "passed").length;
    const failed = this.results.filter((r) => r.status === "failed").length;
    const skipped = this.results.filter(
      (r) => r.status === "skipped" || r.status === "timedOut"
    ).length;

    const status = failed > 0 ? "failed" : "completed";

    console.log(
      `\n📊 Results: ${passed} passed, ${failed} failed, ${skipped} skipped (${duration}ms)`
    );

    // Post results to dashboard
    try {
      await this.postWithRetry(`${this.dashboardUrl}/results`, this.results);
      console.log("✅ Results posted to dashboard");
    } catch (error) {
      console.warn(
        "⚠️  Could not post results to dashboard:",
        (error as Error).message
      );
    }

    // Update run status
    try {
      await this.patchWithRetry(
        `${this.dashboardUrl}/runs/${this.runId}`,
        {
          status,
          totalTests: this.results.length,
          passed,
          failed,
          skipped,
          duration,
          completedAt: new Date().toISOString(),
        }
      );
      console.log("✅ Run status updated");
    } catch (error) {
      console.warn(
        "⚠️  Could not update run status:",
        (error as Error).message
      );
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────

  private mapStatus(
    status: string
  ): "passed" | "failed" | "skipped" | "timedOut" {
    switch (status) {
      case "passed":
        return "passed";
      case "failed":
      case "interrupted":
        return "failed";
      case "skipped":
        return "skipped";
      case "timedOut":
        return "timedOut";
      default:
        return "skipped";
    }
  }

  private countTests(suite: Suite): number {
    let count = 0;
    suite.allTests().forEach(() => count++);
    return count;
  }

  private async postWithRetry(url: string, data: unknown): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) return;
      } catch {
        if (attempt < 2) await this.delay(1000 * (attempt + 1));
      }
    }
  }

  private async patchWithRetry(url: string, data: unknown): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (response.ok) return;
      } catch {
        if (attempt < 2) await this.delay(1000 * (attempt + 1));
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
