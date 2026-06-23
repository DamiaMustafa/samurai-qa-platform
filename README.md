# ⚔️ Samurai QA Platform

A comprehensive QA automation testing platform for **Samurai Central Staging** (`https://staging.visionsamur.ai`).

## Architecture

```
samurai-qa-platform/
├── packages/
│   ├── shared/          # Shared TypeScript types & constants
│   ├── tests/           # Playwright test framework (Page Object Model)
│   └── dashboard/       # Next.js web dashboard for QA engineers
```

## Tech Stack

| Component        | Technology                              |
| ---------------- | --------------------------------------- |
| Test Framework   | Playwright + TypeScript                 |
| Pattern          | Page Object Model + Custom Fixtures     |
| Dashboard        | Next.js 15 (App Router) + TypeScript    |
| Styling          | Tailwind CSS                            |
| Database         | SQLite via Prisma                       |
| Charts           | Recharts                                |
| Monorepo         | npm workspaces                          |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy `.env.example` to `.env` in both the root and `packages/tests/`:

```bash
cp .env.example .env
cp packages/tests/.env.example packages/tests/.env
```

Edit `packages/tests/.env` and fill in your credentials:

```env
BASE_URL=https://staging.visionsamur.ai
ADMIN_USERNAME=your-admin-email
ADMIN_PASSWORD=your-admin-password
STANDARD_USERNAME=your-user-email
STANDARD_PASSWORD=your-user-password
```

### 3. Set Up Database

```bash
npm run db:push
```

### 4. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 5. Start the Dashboard

```bash
npm run dev:dashboard
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Running Tests

```bash
# Run all tests
npm run test:all

# Run smoke tests only
npm run test:smoke

# Run tests with browser visible
npm run test:headed

# Run tests with Playwright UI
npm run test:ui

# Debug tests
npm -w packages/tests run test:debug
```

### Using the Dashboard

- **Dashboard** (`/`) — Overview with stats cards, pass/fail chart, trend chart, and recent runs
- **Test Runs** (`/runs`) — Full history of test executions with progress bars
- **Run Detail** (`/runs/[id]`) — Expandable test results with step timelines, errors, and screenshots
- **Test Cases** (`/tests`) — Searchable browser for all discovered test cases
- **Settings** (`/settings`) — Configure environment URLs, credentials, and test parameters

### Triggering Tests from Dashboard

Click the **"▶ Run Tests"** button on the dashboard or runs page. You can:
- Run all tests
- Filter by suite (`@smoke`, `@auth`, `@dashboard`)
- Enter a custom grep filter

The dashboard spawns Playwright as a background process and displays results in real-time.

## Test Framework

### Page Objects

Located in `packages/tests/src/pages/`:

| Page Object     | Purpose                                   |
| --------------- | ----------------------------------------- |
| `BasePage`      | Navigation, waiting, screenshots, assertions |
| `LoginPage`     | Login form interactions, auth validation  |
| `DashboardPage` | Dashboard widgets, data tables, search    |
| `NavigationPage`| Sidebar/menu navigation, logout           |

### Custom Fixtures

```typescript
import { test, expect } from "../src/fixtures";

test("my test", async ({ loginPage, dashboardPage, navigationPage }) => {
  await loginPage.loginAs("admin");
  await dashboardPage.goto();
  await dashboardPage.expectDashboardLoaded();
});
```

### Auth Fixture (pre-authenticated)

```typescript
import { authTest, expect } from "../src/fixtures";

authTest("authenticated test", async ({ authenticatedPage }) => {
  const { dashboardPage } = authenticatedPage;
  await dashboardPage.goto();
  // Already logged in as admin
});
```

### Helpers

- **`auth-helper`** — Save/load browser storage state for session reuse
- **`api-helper`** — Make HTTP requests within tests for setup/teardown
- **`data-generator`** — Random strings, emails, names, phones for test data
- **`screenshot-helper`** — Capture and attach screenshots to test reports

### Adding New Tests

1. Create a new `.spec.ts` file in `packages/tests/tests/`
2. Use the custom fixtures from `src/fixtures`
3. Tag tests with `@smoke`, `@auth`, `@dashboard`, etc. for filtering
4. Page object selectors are verified against the staging DOM — see [Customizing Page Object Selectors](#customizing-page-object-selectors)

## How It Works

```
Dashboard UI                    API                     Playwright
─────────                    ────                     ──────────
Click "Run" ──→ POST /api/trigger ──→ Create DB record
                  │                   Spawn Playwright ──→ Run tests
                  │                                        │
                  └── Return runId ◄──┘                    │
                                                           │
UI polls ◄── GET /api/runs/[id]                            │
                                                           │
                                    Reporter POSTs results ◄┘
                                    PATCH run status ◄──────┘
                                                           │
UI shows results ◄─────────────────────────────────────────┘
```

### Custom Reporter

The `DashboardReporter` in `packages/tests/src/reporters/` automatically:
1. Registers a test run with the dashboard API on `onBegin`
2. Collects test results (steps, errors, screenshots) on `onTestEnd`
3. Posts all results and updates run status on `onEnd`

Results flow into the dashboard regardless of how tests are triggered (CLI or dashboard UI).

## Scripts Reference

| Script                | Description                          |
| --------------------- | ------------------------------------ |
| `npm run dev:dashboard` | Start dashboard dev server         |
| `npm run build:dashboard` | Build dashboard for production   |
| `npm run test:all`      | Run all Playwright tests           |
| `npm run test:smoke`    | Run smoke tests only               |
| `npm run test:headed`   | Run tests with visible browser     |
| `npm run test:ui`       | Run tests with Playwright UI mode  |
| `npm run db:push`       | Sync Prisma schema to SQLite       |
| `npm run db:studio`     | Open Prisma Studio                 |

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `BASE_URL` — Samurai Central staging URL
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — Admin test account
- `STANDARD_USERNAME` / `STANDARD_PASSWORD` — Standard user test account
- `DASHBOARD_API_URL` — Where the reporter sends results
- `TEST_TIMEOUT` — Default test timeout in ms
- `TEST_RETRIES` — Number of retry attempts
- `TEST_WORKERS` — Parallel test workers

## Customizing Page Object Selectors

Page object selectors have been **verified against the actual Samurai Central staging DOM**. The target app is built with:

- **Angular** with lazy-loaded route modules
- **Custom `tw-*` component library** (form fields, inputs, buttons, error displays)
- **Angular Material** (sidenav, menus, progress indicators)

Key DOM elements on the sign-in page (`/sign-in`):

| Element          | Selector                          | Notes                                |
| ---------------- | --------------------------------- | ------------------------------------ |
| Email input      | `input[type="email"]`             | Inside `<tw-input id="login-email">` |
| Password input   | `input[type="password"]`          | Inside `<tw-input id="login-password">` |
| Submit button    | `#login-sign-in-button`           | `<button type="submit" tw-button>`   |
| Error message    | `.welcome__login-error`           | `<tw-error>` shown on invalid creds  |
| Forgot password  | `#login-forgot-password-link`     | `<a routerLink="/forgot-password">`  |

If the app DOM changes, update selectors in the corresponding Page Object class. Prefer `id` attributes and `data-testid` for stability.

## Troubleshooting

### Tests fail with "Cannot find module" or "Playwright not found"

```bash
# Reinstall dependencies and browsers
npm install
npx playwright install chromium
```

### Dashboard shows "Could not reach the server"

The dashboard must be running for triggered test runs to work:

```bash
npm run dev:dashboard
# Then in another terminal:
npm run test:all
```

If running tests via CLI only (without the dashboard), the `DashboardReporter` will log a warning but tests still execute normally. Results are also available in the HTML report:

```bash
npx playwright show-report --config packages/tests/playwright.config.ts
```

### Database errors ("no such table")

```bash
npm run db:push    # Re-sync Prisma schema to SQLite
```

### Tests time out on sign-in page

- Verify `BASE_URL` in `packages/tests/.env` is correct and reachable
- The staging app is a client-side rendered Angular SPA — the sign-in form loads after JavaScript executes
- Increase `TEST_TIMEOUT` in `.env` if the staging server is slow:
  ```env
  TEST_TIMEOUT=120000
  ```

### Login tests skip with "credentials not configured"

Fill in `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `packages/tests/.env`. Tests that require credentials are automatically skipped when not configured.

### Port 3000 already in use

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
# Or set a different port in packages/dashboard/.env
PORT=3001 npm run dev:dashboard
```

### Playwright browser fails to launch (WSL/Linux)

```bash
# Install system dependencies for Chromium
npx playwright install-deps chromium
```

## Contributing

1. **Branch**: Create a feature branch from `main`
2. **Tests**: Add tests in `packages/tests/tests/` using the Page Object Model
3. **Selectors**: Verify selectors against the actual staging DOM before committing
4. **Types**: Run `npm run typecheck` before pushing
5. **PR**: Open a pull request with a description of what was added/changed

### Adding a New Page Object

```typescript
// packages/tests/src/pages/NewPage.ts
import { type Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class NewPage extends BasePage {
  // Verify selectors against actual DOM first
  private readonly mainElement = '#actual-dom-id';

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate("/route");
    await this.waitForReady();
  }
}
```

Then export from `packages/tests/src/pages/index.ts` and add as a fixture in `packages/tests/src/fixtures/`.

### Tagging Tests

Use consistent tags for suite filtering:

| Tag          | Purpose                              |
| ------------ | ------------------------------------ |
| `@smoke`     | Critical path — should always pass   |
| `@auth`      | Authentication and authorization     |
| `@dashboard` | Dashboard-specific functionality     |
| `@settings`  | Settings and configuration           |
| `@e2e`       | Full end-to-end user flows           |

## License

Internal project — not for external distribution.
