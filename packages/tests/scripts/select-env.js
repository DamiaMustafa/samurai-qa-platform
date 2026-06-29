#!/usr/bin/env node

/**
 * select-env.js — Interactive environment selector for Playwright tests.
 *
 * Usage:
 *   npm run test:select                    ← prompts for env, runs all tests
 *   npm run test:select -- --grep @smoke   ← prompts for env, runs smoke tests
 *   npm run test:select -- --env dev       ← skip prompt, use dev
 *
 * How it works:
 *   1. Parses --env <name> from CLI args (or prompts interactively)
 *   2. Loads .env and validates the selected env has credentials
 *   3. Sets ACTIVE_ENV and spawns `npx playwright test` with remaining args
 */

const readline = require("readline");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// ── Supported environments ──────────────────────────────
const ENVS = ["staging", "dev", "prod"];

// ── Parse CLI args ──────────────────────────────────────
const rawArgs = process.argv.slice(2);
let selectedEnv = null;
const passthroughArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === "--env" && rawArgs[i + 1]) {
    selectedEnv = rawArgs[++i].toLowerCase();
  } else {
    passthroughArgs.push(rawArgs[i]);
  }
}

// ── Load .env (lightweight parser, no dotenv dependency) ─
function loadEnvFile() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    console.error("❌  .env file not found at", envPath);
    process.exit(1);
  }

  const vars = {};
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    vars[key] = val;
  }
  return vars;
}

// ── Validate env has credentials ─────────────────────────
function validateEnv(envName, vars) {
  const prefix = envName.toUpperCase();
  const baseUrl = vars[`${prefix}_BASE_URL`];
  const email = vars[`${prefix}_EMAIL`];
  const password = vars[`${prefix}_PASSWORD`];

  const missing = [];
  if (!baseUrl) missing.push(`${prefix}_BASE_URL`);
  if (!email) missing.push(`${prefix}_EMAIL`);
  if (!password) missing.push(`${prefix}_PASSWORD`);

  return { baseUrl, email, password, missing };
}

// ── Interactive prompt ──────────────────────────────────
function promptEnv() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n🌍  Select target environment:\n");
    ENVS.forEach((e, i) => console.log(`   ${i + 1}. ${e}`));
    console.log();

    rl.question("Enter choice (1-3): ", (answer) => {
      rl.close();
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < ENVS.length) {
        resolve(ENVS[idx]);
      } else {
        console.error(`❌  Invalid selection: "${answer}"`);
        process.exit(1);
      }
    });
  });
}

// ── Run Playwright ──────────────────────────────────────
function runPlaywright(envName, extraArgs) {
  const prefix = envName.toUpperCase();
  const vars = loadEnvFile();
  const { baseUrl, email, password, missing } = validateEnv(envName, vars);

  if (missing.length > 0) {
    console.error(`\n❌  Missing required vars for ${envName}:`);
    missing.forEach((v) => console.error(`   • ${v}`));
    console.error(`\n   Fill them in packages/tests/.env and try again.\n`);
    process.exit(1);
  }

  console.log(`\n🚀  Running tests against: ${envName}`);
  console.log(`   URL:   ${baseUrl}`);
  console.log(`   Email: ${email}\n`);

  const child = spawn("npx", ["playwright", "test", ...extraArgs], {
    stdio: "inherit",
    env: {
      ...process.env,
      ACTIVE_ENV: envName,
      BASE_URL: baseUrl,
      TEST_EMAIL: email,
      TEST_PASSWORD: password,
    },
    cwd: path.resolve(__dirname, ".."),
  });

  child.on("exit", (code) => process.exit(code ?? 0));
  child.on("error", (err) => {
    console.error("❌  Failed to start Playwright:", err.message);
    process.exit(1);
  });
}

// ── Main ────────────────────────────────────────────────
(async () => {
  if (!selectedEnv) {
    selectedEnv = await promptEnv();
  }

  if (!ENVS.includes(selectedEnv)) {
    console.error(
      `❌  Unknown environment "${selectedEnv}". Choose from: ${ENVS.join(", ")}`
    );
    process.exit(1);
  }

  runPlaywright(selectedEnv, passthroughArgs);
})();
