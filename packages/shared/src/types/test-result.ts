// ── Test Step ───────────────────────────────────────────────────────────────
export interface TestStepInfo {
  title: string;
  status: "passed" | "failed" | "skipped" | "timedOut";
  duration: number; // milliseconds
  error?: string | null;
  screenshot?: string | null; // relative path to screenshot file
  startTime: string; // ISO 8601
}

// ── Test Result (one per spec/test) ────────────────────────────────────────
export interface TestResult {
  id?: number;
  runId: string; // UUID linking results to a run
  suiteName: string; // e.g., "auth", "dashboard"
  testName: string; // full test title
  status: "passed" | "failed" | "skipped" | "timedOut";
  duration: number; // total ms
  retries: number;
  steps: TestStepInfo[];
  errors: string[]; // error messages
  screenshots: string[]; // relative paths
  videoPath?: string | null;
  logPath?: string | null;
  startedAt: string; // ISO 8601
  completedAt: string; // ISO 8601
}

// ── Test Run (aggregates multiple results) ─────────────────────────────────
export interface TestRun {
  id: string; // UUID
  trigger: "manual" | "scheduled" | "ci";
  suite?: string | null; // optional suite filter
  status: "running" | "completed" | "failed";
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // total ms
  startedAt: string;
  completedAt?: string | null;
  results?: TestResult[];
}

// ── Test Case Metadata ─────────────────────────────────────────────────────
export interface TestCase {
  id: string;
  name: string;
  suite: string;
  file: string;
  tags: string[];
  lastStatus?: "passed" | "failed" | "skipped" | "unknown";
  lastRunAt?: string | null;
}
