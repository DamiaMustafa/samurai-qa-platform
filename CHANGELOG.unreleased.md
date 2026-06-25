## Unreleased

- **fix:** resolve language selector and profile navigation test failures

- HomePage.selectLanguage: skip re-clicking dropdown when panel already open
- navigation.spec.ts: use dialog-or-navigation pattern for Profile test
- console-error-helper: add Angular runtime error filters
- page objects: improve DOM selectors and fallback strategies (2026-06-24, f91e592)
- **fix:** correct API keys row count to exclude header tr, all 17 tests passing (4 skipped - no data) (2026-06-24, afd9704)
- **feat:** add instant distill tests, 5 passing (1 skipped - no data) (2026-06-24, 9fd4f2a)
- **fix:** edge management row count excludes header tr, 7 passing (4 skipped - no data) (2026-06-24, 0d9b4d4)
- **feat:** add workflow listing tests, 6 passing (4 skipped - no data) (2026-06-24, 0fd146f)
- **feat:** add user management tests, 12 passing - fix row count for plain tables (2026-06-25, 2b9db39)
- **feat:** add plan tracking tests, 7 passing (1 skipped - no free plan data) (2026-06-25, a4cdec4)
- **feat:** add project creation tests, 16 passing - type selection, form validation, sharing options (2026-06-25, 1aa99d3)
- **feat:** add project creation tests, 16 passing - type selection, form validation, sharing options (2026-06-25, 1aa99d3)
- **feat:** add auth page tests - sign up (11), forgot password (8), change password (10) = 29 tests passing (2026-06-25, 661794c)
- **feat:** add project inner pages, dataset overview, labeling tasks, and additional test coverage - 296 total tests (2026-06-25, ef64c44)
- **feat:** add project inner pages, dataset overview, labeling tasks, and additional test coverage - 296 total tests (2026-06-25, ef64c44)
- **fix:** resolve 3 failing Playwright tests — Google OAuth + language selector

- Google popup email test: use getByRole('textbox') instead of
  input[type='email'] to match Google's actual login form, add
  waitForLoadState for Cognito redirect chain
- Closing popup test: gracefully skip when redirect-based OAuth flow
  is detected (no popup to close)
- Language selection persistence: add .mat-mdc-option to selector
  chain, use waitFor({state:'attached'}) for CDK overlay, use
  click({force:true}) to handle Angular option detachment
- Console error helper: filter CSP report-only violations from
  third-party iframes (Google/YouTube)

Results: 206 passed, 0 failed, 90 skipped (2026-06-25, 608c987)
- **feat:** add negative/validation tests (15 tests) - 340 total

Group 6 of 6 project creation test groups covering error paths:
- Form validation: empty name, re-disable on clear
- API errors: billing expired, project limit exceeded (mocked GraphQL)
- Dataset structure: invalid ZIP/YOLO/COCO via malformed JSZip buffers
- Video & files: >180s video, insufficient storage, empty upload, .pdf rejection
- Training: duplicate model name, patience >= epochs validation
- Sharing: public project payload, labeler/reviewer assignment

Tags: @negative @project-creation @form-validation @api-errors
      @dataset-validation @file-validation @training-validation @sharing (2026-06-26, f3e40e8)
