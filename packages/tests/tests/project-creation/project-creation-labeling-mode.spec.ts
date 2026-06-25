import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import { createApiHelper } from "../../src/helpers/api-helper";
import { timestamp } from "../../src/helpers/data-generator";
import { deflateRawSync } from "zlib";

/**
 * Project Creation — Labeling Mode @project-creation @labeling-mode
 *
 * Verifies the labeling mode selection page that appears after uploading
 * an unlabelled dataset. Three modes are available:
 *
 *   1. Manual ("manual") — dive into details and add labels manually
 *      → navigates to /project/{id}/labeling-task/add
 *   2. Advanced AI ("grounding-dino") — SAM 3 / SigLIP foundation model
 *      → navigates to /project/{id}/auto-labelling/grounding-dino/testing-prompt
 *   3. Pre-trained ("pre-trained") — select a previously trained model
 *      → navigates to /project/{id}/auto-labelling/pre-trained/model-selection
 *      → DISABLED when no trained models exist
 *
 * Default selection: "manual"
 *
 * Test matrix (3 tests):
 *   1. Manual — default, selectable, navigates to labeling task page
 *   2. Advanced AI — selectable, navigates to testing prompt page
 *   3. Pre-trained — disabled for fresh projects (no trained models)
 */

const RUN_TAG = `lbl-mode-${timestamp()}`;

// ── Tiny PNG helper (1×1 white pixel, ~68 bytes) ──────────────────────────

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function pngChunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  let crc = -1;
  const input = Buffer.concat([t, data]);
  for (let i = 0; i < input.length; i++) crc = crcTable[(crc ^ input[i]) & 0xff] ^ (crc >>> 8);
  crc ^= -1;
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeInt32BE(crc, 0);
  return Buffer.concat([len, t, data, crcBuf]);
}

function createTinyPng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.from([0, 255, 255, 255]);
  const compressed = deflateRawSync(raw);
  const idat = Buffer.concat([Buffer.from([0x78, 0x01]), compressed]);
  return Buffer.concat([
    PNG_SIG,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Setup helper ────────────────────────────────────────────────────────────

/**
 * Create a project via UI, upload 1 unlabelled image, and land on the
 * labeling mode selection page. Returns the project ID for cleanup.
 */
async function setupUnlabelledProject(
  fixtures: {
    loginPage: any;
    projectCreationPage: any;
    uploadDatasetPage: any;
    labelingModeSelectionPage: any;
    consoleErrors: any;
    page: any;
  }
): Promise<string> {
  const {
    loginPage,
    projectCreationPage,
    uploadDatasetPage,
    labelingModeSelectionPage,
    consoleErrors,
    page,
  } = fixtures;

  await loginPage.loginAs("admin");
  const error = await loginPage.getLoginErrorMessage();
  test.skip(!!error, `Login blocked by environment: ${error}`);

  // Create project
  await projectCreationPage.goto();
  await projectCreationPage.selectType("object_detection");
  await projectCreationPage.fillName(`Label Mode | ${RUN_TAG}`);
  await projectCreationPage.clickSubmit();
  expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);

  // Navigate to upload page
  await projectCreationPage.clickUploadDatasetNow();
  await expect(page).toHaveURL(/\/dataset\/.+\/add/, { timeout: 15_000 });
  consoleErrors.assertNoErrors();

  // Upload 1 unlabelled image
  await uploadDatasetPage.waitForReady();
  // Default is "unlabelled" — just upload a tiny PNG
  await uploadDatasetPage.uploadFiles([
    { name: "img_001.jpg", mimeType: "image/jpeg", buffer: createTinyPng() },
  ]);
  await uploadDatasetPage.waitForValidationComplete();
  await uploadDatasetPage.clickUploadDataset();
  consoleErrors.assertNoErrors();

  // Should land on labeling mode selection page
  await labelingModeSelectionPage.waitForReady();
  expect(await labelingModeSelectionPage.isLoaded()).toBe(true);
  consoleErrors.assertNoErrors();

  // Extract project ID from URL
  const url = page.url();
  const match = url.match(/\/project\/([^/]+)\//);
  return match ? match[1] : "";
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe("Project Creation — Labeling Mode @project-creation @labeling-mode", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | undefined;

  test.beforeEach(
    async ({
      loginPage,
      projectCreationPage,
      uploadDatasetPage,
      labelingModeSelectionPage,
      consoleErrors,
      page,
    }) => {
      projectId = await setupUnlabelledProject({
        loginPage,
        projectCreationPage,
        uploadDatasetPage,
        labelingModeSelectionPage,
        consoleErrors,
        page,
      });
    }
  );

  test.afterEach(async ({ page }) => {
    if (!projectId) return;
    try {
      const api = createApiHelper(page, envConfig.apiBaseUrl);
      await api.patch(`/projects/${projectId}`, { archived: true });
    } catch {
      // Best-effort cleanup
    }
  });

  // ─── Manual ──────────────────────────────────────────────────────────────

  test("Manual — default mode, selectable, navigates to labeling task page", async ({
    labelingModeSelectionPage,
    consoleErrors,
    page,
  }) => {
    // Manual should be the default selection
    expect(await labelingModeSelectionPage.isModeSelected("manual")).toBe(true);
    consoleErrors.assertNoErrors();

    // Click Next with the default selection
    await labelingModeSelectionPage.clickNext();

    // Should navigate to the labeling task creation page
    await expect(page).toHaveURL(/labeling-task\/add/, { timeout: 15_000 });
    consoleErrors.assertNoErrors();
  });

  // ─── Advanced AI (grounding-dino) ────────────────────────────────────────

  test("Advanced AI — selectable, navigates to testing prompt page", async ({
    labelingModeSelectionPage,
    consoleErrors,
    page,
  }) => {
    // Select Advanced AI / Foundation Model
    await labelingModeSelectionPage.selectMode("grounding-dino");
    expect(
      await labelingModeSelectionPage.isModeSelected("grounding-dino")
    ).toBe(true);
    consoleErrors.assertNoErrors();

    // Click Next
    await labelingModeSelectionPage.clickNext();

    // Should navigate to the testing prompt page
    await expect(page).toHaveURL(/auto-labelling\/grounding-dino/, {
      timeout: 15_000,
    });
    consoleErrors.assertNoErrors();
  });

  // ─── Pre-trained ─────────────────────────────────────────────────────────

  test("Pre-trained — disabled for fresh project (no trained models)", async ({
    labelingModeSelectionPage,
    consoleErrors,
  }) => {
    // Pre-trained should be disabled because no models have been trained
    // on this fresh project
    expect(await labelingModeSelectionPage.isModeDisabled("pre-trained")).toBe(
      true
    );

    // Manual and Advanced AI should still be enabled
    expect(await labelingModeSelectionPage.isModeDisabled("manual")).toBe(
      false
    );
    expect(
      await labelingModeSelectionPage.isModeDisabled("grounding-dino")
    ).toBe(false);

    consoleErrors.assertNoErrors();
  });
});
