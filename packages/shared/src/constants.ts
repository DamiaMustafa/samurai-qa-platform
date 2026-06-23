export const DASHBOARD_PORT = 3000;
export const DASHBOARD_BASE_URL = `http://localhost:${DASHBOARD_PORT}`;

export const DASHBOARD_API = {
  RESULTS: `${DASHBOARD_BASE_URL}/api/results`,
  RUNS: `${DASHBOARD_BASE_URL}/api/runs`,
  TRIGGER: `${DASHBOARD_BASE_URL}/api/trigger`,
  SETTINGS: `${DASHBOARD_BASE_URL}/api/settings`,
} as const;

export const TEST_STATUS = {
  PASSED: "passed",
  FAILED: "failed",
  SKIPPED: "skipped",
  TIMED_OUT: "timedOut",
} as const;

export const RUN_STATUS = {
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const TRIGGER_TYPE = {
  MANUAL: "manual",
  SCHEDULED: "scheduled",
  CI: "ci",
} as const;
