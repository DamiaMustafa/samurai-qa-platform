#!/usr/bin/env node
/**
 * Samurai QA Platform — Dashboard Server
 *
 * Starts a local HTTP server that:
 *   - Serves the QA dashboard UI (index.html)
 *   - Runs Playwright tests via child_process.spawn
 *   - Streams live test output to the browser via Server-Sent Events
 *   - Parses Playwright JSON results and sends them back to the UI
 *   - Sends Slack notifications on test start and completion
 *
 * Usage:
 *   node server.js                          # port 3000 (default)
 *   DASHBOARD_PORT=8080 node server.js      # custom port
 *
 * Environment variables:
 *   DASHBOARD_PORT     — HTTP port (default 3000)
 *   SLACK_WEBHOOK_URL  — Slack incoming webhook URL (optional)
 *   DEV_BASE_URL       — Dev environment URL (default http://localhost:4200)
 *   STAGING_BASE_URL   — Staging URL (default https://staging.visionsamur.ai)
 *   PROD_BASE_URL      — Production URL (default https://visionsamur.ai)
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const url = require('url');

// ── Config ──────────────────────────────────────────────
const PORT = parseInt(process.env.DASHBOARD_PORT || '3000', 10);
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL ?? '';

const ENV_URLS = {
  dev:        process.env.DEV_BASE_URL     || 'http://localhost:4200',
  staging:    process.env.STAGING_BASE_URL || 'https://staging.visionsamur.ai',
  production: process.env.PROD_BASE_URL    || 'https://visionsamur.ai',
};

const TEST_DIR      = path.resolve(__dirname, '..');       // packages/tests/
const DASH_DIR      = __dirname;                            // packages/tests/dashboard/
const JSON_OUT      = path.join(DASH_DIR, '.test-results.json');
const ALLURE_IN     = path.join(TEST_DIR, 'allure-results');
const ALLURE_OUT    = path.join(TEST_DIR, 'allure-report');

const SUITE_LABELS = {
  all:        'ALL Tests (~492)',
  critical:   'Critical Path (27)',
  functional: 'Functional (~465)',
};

// ── In-memory state ─────────────────────────────────────
let currentRun = null;   // { proc, clients: Set<res>, lines: string[], done: boolean, result: object|null }

// ── HTTP helpers ────────────────────────────────────────
function json(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ── ANSI stripping ──────────────────────────────────────
function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b/g, '');
}

// ── SSE helpers ─────────────────────────────────────────
function sseInit(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    ...corsHeaders(),
  });
  res.flushHeaders();
}

function sseSend(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Test runner ─────────────────────────────────────────
function runTests({ env, username, password, suite }) {
  // Kill any running test
  if (currentRun && currentRun.proc) {
    currentRun.proc.kill('SIGTERM');
  }

  // Clean previous JSON results
  if (fs.existsSync(JSON_OUT)) fs.unlinkSync(JSON_OUT);

  const envUpper = env.toUpperCase();

  // Resolve base URL for the selected environment
  const baseUrl = ENV_URLS[env] || ENV_URLS.staging;

  // Build Playwright args based on suite selection
  const pwArgs = ['playwright', 'test'];

  if (suite === 'critical') {
    pwArgs.push('e2e/critical-path/');
  } else if (suite === 'functional') {
    pwArgs.push('tests/');
  }
  // 'all' — no path filter, runs everything

  pwArgs.push('--reporter=list,json');

  // Environment for the Playwright child process
  const procEnv = {
    ...process.env,
    ACTIVE_ENV: envUpper,
    BASE_URL: baseUrl,
    TEST_EMAIL: username,
    TEST_PASSWORD: password,
    PLAYWRIGHT_JSON_OUTPUT_NAME: JSON_OUT,
    NO_COLOR: '1',
  };

  const proc = spawn('npx', pwArgs, {
    cwd: TEST_DIR,
    env: procEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  });

  currentRun = {
    proc,
    clients: new Set(),
    lines: [],
    done: false,
    result: null,
    exitCode: null,
    startTime: Date.now(),
    params: { env, suite },
  };

  // ── Stream stdout (list reporter) ──
  let buffer = '';
  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    let nl;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = stripAnsi(buffer.slice(0, nl)).trimEnd();
      buffer = buffer.slice(nl + 1);
      if (line) broadcast('log', { line });
    }
  });

  // ── Stream stderr ──
  proc.stderr.on('data', (chunk) => {
    const line = stripAnsi(chunk.toString()).trim();
    if (line) broadcast('log', { line });
  });

  // ── On exit ──
  proc.on('close', async (code) => {
    // Flush remaining buffer
    if (buffer.trim()) broadcast('log', { line: stripAnsi(buffer).trimEnd() });

    currentRun.exitCode = code;

    // Parse JSON results
    let results = null;
    try {
      if (fs.existsSync(JSON_OUT)) {
        const raw = fs.readFileSync(JSON_OUT, 'utf-8');
        results = parsePlaywrightJson(raw);
        // Clean up
        fs.unlinkSync(JSON_OUT);
      }
    } catch (err) {
      console.error('[dashboard] JSON parse error:', err.message);
    }

    currentRun.done = true;
    currentRun.result = { exitCode: code, results };

    // Send completion event to all connected clients
    broadcast('done', { exitCode: code, results });

    // Generate Allure report (non-blocking)
    generateAllureReport();

    // Slack notification
    await sendSlack({
      ...currentRun.params,
      exitCode: code,
      results,
      duration: Date.now() - currentRun.startTime,
    });
  });

  proc.on('error', (err) => {
    broadcast('error_msg', { message: `Failed to start Playwright: ${err.message}` });
    currentRun.done = true;
    currentRun.result = { exitCode: -1, results: null };
    broadcast('done', { exitCode: -1, results: null });
  });

  // Send start Slack notification (non-blocking)
  sendSlack({
    env,
    suite,
    type: 'start',
    label: SUITE_LABELS[suite] || suite,
  });
}

function broadcast(event, data) {
  if (!currentRun) return;
  currentRun.lines.push({ event, data }); // store for replay on reconnect
  for (const res of currentRun.clients) {
    try { sseSend(res, event, data); } catch {}
  }
}

// ── JSON results parser ─────────────────────────────────
function parsePlaywrightJson(raw) {
  const report = JSON.parse(raw);
  const tests = [];
  let pass = 0, fail = 0, skip = 0;

  for (const suite of flattenSuites(report.suites || [])) {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        const last = t.results[t.results.length - 1];
        const status = last?.status || t.status || 'unknown';
        const name = `${suite.title} > ${spec.title}`;
        const duration = last?.duration || 0;
        const error = last?.error
          ? (last.error.message || String(last.error))
          : (last?.errors?.[0]?.message || null);

        if (status === 'passed' || status === 'expected') pass++;
        else if (status === 'failed' || status === 'unexpected') fail++;
        else skip++;

        tests.push({
          name,
          status: status === 'expected' ? 'passed' : status === 'unexpected' ? 'failed' : status,
          duration,
          error,
        });
      }
    }
  }

  return { total: pass + fail + skip, pass, fail, skip, tests };
}

function flattenSuites(suites, out = []) {
  for (const s of suites) {
    if (s.specs && s.specs.length) out.push(s);
    if (s.suites) flattenSuites(s.suites, out);
  }
  return out;
}

// ── Allure report generation ────────────────────────────
function generateAllureReport() {
  if (!fs.existsSync(ALLURE_IN)) {
    console.log('[allure] No allure-results directory found — skipping report generation');
    return;
  }
  console.log('[allure] Generating report...');
  const proc = spawn('npx', ['allure', 'generate', ALLURE_IN, '--clean', '-o', ALLURE_OUT], {
    cwd: TEST_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  });
  proc.stderr.on('data', (d) => process.stderr.write(d));
  proc.on('close', (code) => {
    if (code === 0) {
      console.log(`[allure] Report ready → http://localhost:${PORT}/allure-report/`);
      broadcast('allure_ready', { url: `/allure-report/` });
    } else {
      console.warn(`[allure] Generation failed (exit ${code})`);
    }
  });
  proc.on('error', (e) => console.warn('[allure] Could not start allure:', e.message));
}

// ── Slack notifications ─────────────────────────────────
async function sendSlack(data) {
  if (!SLACK_WEBHOOK) return;

  const envLabel = (data.env || '').toUpperCase();
  const suiteLabel = data.label || SUITE_LABELS[data.suite] || data.suite;

  let text;
  if (data.type === 'start') {
    text = `:robot_face: *Samurai QA — Tests Starting*\n> Environment: *${envLabel}*\n> Suite: *${suiteLabel}*`;
  } else {
    const r = data.results || {};
    const emoji = data.exitCode === 0 ? ':white_check_mark:' : ':x:';
    const status = data.exitCode === 0 ? 'PASSED' : 'FAILED';
    const durMs  = data.duration || 0;
    const durStr = durMs >= 3_600_000
      ? `${Math.floor(durMs / 3_600_000)}h ${Math.floor((durMs % 3_600_000) / 60_000)}m`
      : durMs >= 60_000
        ? `${Math.floor(durMs / 60_000)}m ${Math.floor((durMs % 60_000) / 1000)}s`
        : `${(durMs / 1000).toFixed(1)}s`;

    const failedTests = (r.tests || []).filter((t) => t.status === 'failed');
    const failedBlock = failedTests.length > 0
      ? '\n\n*Failed tests:*\n' + failedTests.slice(0, 10).map((t) => {
          const name = t.name.split(' > ').pop() || t.name;
          const err  = (t.error || 'unknown error').replace(/\n.*/s, '').substring(0, 120);
          return `• \`${name}\`\n  ${err}`;
        }).join('\n') + (failedTests.length > 10 ? `\n• … and ${failedTests.length - 10} more` : '')
      : '';

    text = [
      `${emoji} *Samurai QA — Tests ${status}*`,
      `> Environment: *${envLabel}*`,
      `> Suite: *${suiteLabel}*`,
      `> Results: *${r.pass || 0} passed*, *${r.fail || 0} failed*, ${r.skip || 0} skipped (${r.total || 0} total)`,
      `> Duration: ${durStr}`,
      failedBlock,
    ].join('\n');
  }

  try {
    const parsed = new URL(SLACK_WEBHOOK);
    const payload = JSON.stringify({ text });

    const req = http.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        // Consume response to free socket
        res.on('data', () => {});
        res.on('end', () => {
          if (res.statusCode !== 200) {
            console.warn(`[slack] webhook returned ${res.statusCode}`);
          }
        });
      }
    );

    req.on('error', (e) => console.warn('[slack] notification failed:', e.message));
    req.write(payload);
    req.end();
  } catch (e) {
    console.warn('[slack] error:', e.message);
  }
}

// ── Request router ──────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const p = parsed.pathname;
  const m = req.method;

  // CORS preflight
  if (m === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  // ── Serve dashboard HTML ──
  if (p === '/' && m === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(path.join(DASH_DIR, 'index.html')).pipe(res);
  }

  // ── Start test run or reconnect (SSE stream) ──
  if (p === '/api/run/stream' && m === 'GET') {
    const q = parsed.query;

    // Reconnect mode: browser refreshed while run is active/just finished
    if (q.reconnect === '1') {
      if (!currentRun) return json(res, { error: 'No active run' }, 404);
      sseInit(res);
      currentRun.clients.add(res);
      // Replay all buffered events so the page catches up
      for (const { event, data } of currentRun.lines) {
        try { sseSend(res, event, data); } catch {}
      }
      req.on('close', () => { if (currentRun) currentRun.clients.delete(res); });
      return;
    }

    // New run: validate params
    const { env, username, password, suite } = q;
    if (!env || !username || !password || !suite) {
      return json(res, { error: 'Missing required query params: env, username, password, suite' }, 400);
    }
    if (!['dev', 'staging', 'production'].includes(env)) {
      return json(res, { error: `Invalid env: ${env}` }, 400);
    }
    if (!SUITE_LABELS[suite]) {
      return json(res, { error: `Invalid suite: ${suite}` }, 400);
    }

    runTests({ env, username, password, suite });
    sseInit(res);
    if (currentRun) currentRun.clients.add(res);
    req.on('close', () => { if (currentRun) currentRun.clients.delete(res); });
    return;
  }

  // ── Get current run status ──
  if (p === '/api/run/status' && m === 'GET') {
    if (!currentRun) return json(res, { running: false, done: false });
    return json(res, {
      running: !currentRun.done,
      done: currentRun.done,
      exitCode: currentRun.exitCode,
      env: currentRun.params?.env,
      suite: currentRun.params?.suite,
      suiteLabel: SUITE_LABELS[currentRun.params?.suite] || currentRun.params?.suite,
      startTime: currentRun.startTime,
      result: currentRun.done ? currentRun.result : null,
      allureReady: fs.existsSync(path.join(ALLURE_OUT, 'index.html')),
    });
  }

  // ── Get last results (JSON) ──
  if (p === '/api/results' && m === 'GET') {
    if (!currentRun || !currentRun.result) {
      return json(res, { error: 'No results available' }, 404);
    }
    return json(res, currentRun.result);
  }

  // ── Serve Allure report (static) ──
  if (p.startsWith('/allure-report/') && m === 'GET') {
    const rel  = p.replace(/^\/allure-report\//, '') || 'index.html';
    const file = path.join(ALLURE_OUT, rel);
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const mime = {
        '.html': 'text/html', '.js': 'application/javascript',
        '.css': 'text/css',   '.json': 'application/json',
        '.png': 'image/png',  '.svg': 'image/svg+xml',
        '.woff2': 'font/woff2', '.woff': 'font/woff',
      }[path.extname(file)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, ...corsHeaders() });
      return fs.createReadStream(file).pipe(res);
    }
    return json(res, { error: 'Not found' }, 404);
  }

  // ── 404 ──
  json(res, { error: 'Not found' }, 404);
});

// ── Start ───────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │  侍  Samurai QA Platform                │
  │                                         │
  │  Dashboard:  http://localhost:${PORT}     │
  │  Test dir:   ${TEST_DIR}
  │  Slack:      ${SLACK_WEBHOOK ? 'configured ✓' : 'not configured'}│
  └─────────────────────────────────────────┘
  `);
});
