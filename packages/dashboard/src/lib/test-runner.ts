import { spawn, type ChildProcess } from "child_process";
import path from "path";
import { existsSync } from "fs";
import { prisma } from "./prisma";

// In-memory map of active test run processes
const activeProcesses = new Map<string, ChildProcess>();

const TESTS_PACKAGE_DIR = path.resolve(
  process.cwd(),
  "..",
  "tests"
);

/**
 * Spawn a Playwright test run as a child process.
 * Returns the runId so the UI can poll for updates.
 */
export function spawnTestRun(
  runId: string,
  suite?: string
): ChildProcess {
  // Validate test directory exists
  if (!existsSync(TESTS_PACKAGE_DIR)) {
    console.error(
      `[test-runner] Tests directory not found: ${TESTS_PACKAGE_DIR}`
    );
    markRunFailed(runId);
    throw new Error(`Tests directory not found: ${TESTS_PACKAGE_DIR}`);
  }

  // Prevent duplicate runs for the same runId
  if (activeProcesses.has(runId)) {
    console.warn(`[test-runner] Run ${runId} is already active`);
    return activeProcesses.get(runId)!;
  }

  const args = ["playwright", "test"];

  if (suite && suite.length <= 200) {
    args.push("--grep", suite);
  }

  const env = {
    ...process.env,
    TEST_RUN_ID: runId,
    TEST_SUITE: suite || "",
  };

  const child = spawn("npx", args, {
    cwd: TESTS_PACKAGE_DIR,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  activeProcesses.set(runId, child);

  child.on("error", async (err) => {
    console.error(`[test-runner] Process error for run ${runId}:`, err.message);
    activeProcesses.delete(runId);
    await markRunFailed(runId);
  });

  child.on("close", async (code) => {
    console.log(`[test-runner] Run ${runId} exited with code ${code}`);
    activeProcesses.delete(runId);

    if (code !== 0) {
      // Check if reporter already updated the status
      const run = await prisma.testRun.findUnique({ where: { id: runId } });
      if (run && run.status === "running") {
        await markRunFailed(runId);
      }
    }
  });

  return child;
}

async function markRunFailed(runId: string): Promise<void> {
  try {
    await prisma.testRun.update({
      where: { id: runId },
      data: {
        status: "failed",
        completedAt: new Date(),
      },
    });
  } catch (err) {
    console.error(`[test-runner] Failed to mark run ${runId} as failed:`, err);
  }
}

export function isRunActive(runId: string): boolean {
  return activeProcesses.has(runId);
}

export function killRun(runId: string): boolean {
  const proc = activeProcesses.get(runId);
  if (proc) {
    proc.kill("SIGTERM");
    activeProcesses.delete(runId);
    return true;
  }
  return false;
}
