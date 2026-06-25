import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import { timestamp } from "../../src/helpers/data-generator";
import { createApiHelper } from "../../src/helpers/api-helper";
import JSZip from "jszip";

/**
 * Project Creation — Negative / Validation Tests @project-creation @negative
 *
 * Group 6 of 6 in the project creation test suite.
 * Covers error paths, boundary conditions, and validation enforcement
 * across the project creation and dataset upload flows.
 *
 * Test matrix (15 tests):
 *   1.  Empty project name → submit button disabled
 *   2.  Submit button re-disables when name is cleared
 *   3.  Billing expired → inform dialog shown
 *   4.  Project limit exceeded → inform dialog shown
 *   5.  Invalid ZIP structure (missing train/test/val) → error dialog
 *   6.  Invalid YOLO structure (missing images/labels) → error dialog
 *   7.  Invalid COCO (missing annotations file) → error dialog
 *   8.  Video > 180 seconds rejected → error dialog
 *   9.  Insufficient storage error → inform dialog
 *  10.  Duplicate model name rejected → error shown
 *  11.  Patience >= epochs in advanced training → validation error
 *  12.  Empty unlabelled upload rejected → error dialog
 *  13.  Wrong file format (.pdf uploaded) → rejected
 *  14.  Public project creation → sends public: true in API payload
 *  15.  Labeler/reviewer assignment → dropdowns functional + sent in payload
 *
 * Cleanup: each created project is archived via API in afterEach.
 */

const RUN_TAG = `neg-${timestamp()}`;

// ─── Shared Helpers ──────────────────────────────────────────────────────────

/**
 * Poll for a visible dialog containing the expected text fragment.
 * Dialog IDs are dynamic (set at runtime by DialogService), so we
 * match on class + text content rather than a fixed selector.
 */
async function waitForDialogWithText(
  page: any,
  textFragment: string,
  timeout = 15_000
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const dialogs = page.locator(".dialog:visible");
    const count = await dialogs.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const text = await dialogs.nth(i).textContent().catch(() => "");
      if (text && text.includes(textFragment)) return;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(
    `Dialog containing "${textFragment}" did not appear within ${timeout}ms`
  );
}

/**
 * Create a tiny fake video buffer (not a valid MP4).
 * Used as a placeholder for upload — the browser cannot parse its
 * metadata, so the V2 server-side validation path is exercised.
 */
function createFakeVideoBuffer(): Buffer {
  // ftyp box header + "isom" brand — looks like an MP4 container
  const header = Buffer.from([
    0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x6d, 0x70, 0x34, 0x31,
  ]);
  return Buffer.concat([header, Buffer.alloc(512, 0)]);
}

/**
 * Create a minimal fake PNG buffer (valid signature, minimal content).
 * Used for wrong-format and empty-upload tests.
 */
function createFakePngBuffer(): Buffer {
  return Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10, // PNG signature
    0, 0, 0, 13, 73, 72, 68, 82, // IHDR chunk
    0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, // 1×1 RGB
    0x90, 0x77, 0x53, 0xde, // CRC
    0, 0, 0, 0, 73, 73, 78, 68, 0xae, 0x42, 0x60, 0x82, // IEND
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Block 1: Form Validation
// ═══════════════════════════════════════════════════════════════════════════════

test.describe(
  "Project Creation — Negative: Form Validation @project-creation @negative @form-validation",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(async ({ loginPage, projectCreationPage }) => {
      await loginPage.loginAs("admin");
      const error = await loginPage.getLoginErrorMessage();
      test.skip(!!error, `Login blocked by environment: ${error}`);
      await projectCreationPage.goto();
    });

    // ─── Test 1 ───────────────────────────────────────────────────────────

    test("empty project name keeps submit button disabled", async ({
      projectCreationPage,
      consoleErrors,
    }) => {
      await projectCreationPage.selectType("object_detection");

      // Without filling the name, submit must remain disabled
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(true);
      consoleErrors.assertNoErrors();
    });

    // ─── Test 2 ───────────────────────────────────────────────────────────

    test("submit button re-disables after clearing project name", async ({
      projectCreationPage,
      consoleErrors,
    }) => {
      await projectCreationPage.selectType("classification");

      // Enable by filling name
      await projectCreationPage.fillName(`Re-disable ${RUN_TAG}`);
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      // Disable again by clearing name
      await projectCreationPage.fillName("");
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Block 2: API Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

test.describe(
  "Project Creation — Negative: API Errors @project-creation @negative @api-errors",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.beforeEach(async ({ loginPage, projectCreationPage }) => {
      await loginPage.loginAs("admin");
      const error = await loginPage.getLoginErrorMessage();
      test.skip(!!error, `Login blocked by environment: ${error}`);
      await projectCreationPage.goto();
    });

    // ─── Test 3: Billing Expired ──────────────────────────────────────────

    test("billing expired — shows subscription error dialog", async ({
      projectCreationPage,
      consoleErrors,
      page,
    }) => {
      // Mock the GraphQL endpoint to return a subscription-expired error
      await page.route("**/graphql", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            errors: [
              {
                message: "Subscription is not active.",
                extensions: { code: "SUBSCRIPTION_EXPIRED" },
              },
            ],
          }),
        });
      });

      await projectCreationPage.selectType("object_detection");
      await projectCreationPage.fillName(`Billing Expired ${RUN_TAG}`);
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      await projectCreationPage.clickSubmit();

      // The inform dialog should appear with the subscription error message
      await waitForDialogWithText(page, "Subscription is not active");
      consoleErrors.assertNoErrors();

      // Cleanup route
      await page.unroute("**/graphql");
    });

    // ─── Test 4: Project Limit Exceeded ───────────────────────────────────

    test("project limit exceeded — shows limit error dialog", async ({
      projectCreationPage,
      consoleErrors,
      page,
    }) => {
      await page.route("**/graphql", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            errors: [
              {
                message:
                  "You have reached the maximum number of projects allowed.",
                extensions: { code: "PROJECT_LIMIT_EXCEEDED" },
              },
            ],
          }),
        });
      });

      await projectCreationPage.selectType("segmentation");
      await projectCreationPage.fillName(`Limit Test ${RUN_TAG}`);
      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

      await projectCreationPage.clickSubmit();

      await waitForDialogWithText(
        page,
        "maximum number of projects allowed"
      );
      consoleErrors.assertNoErrors();

      await page.unroute("**/graphql");
    });
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Block 3: Dataset Structure Validation
// ═══════════════════════════════════════════════════════════════════════════════

test.describe(
  "Project Creation — Negative: Dataset Structure @project-creation @negative @dataset-validation",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    // Extended timeout for project creation + dataset upload + validation
    test.setTimeout(120_000);

    let createdProjectId: string | undefined;

    test.beforeEach(async ({ loginPage, projectCreationPage }) => {
      await loginPage.loginAs("admin");
      const error = await loginPage.getLoginErrorMessage();
      test.skip(!!error, `Login blocked by environment: ${error}`);
      createdProjectId = undefined;
    });

    test.afterEach(async ({ page }) => {
      if (!createdProjectId) return;
      try {
        const api = createApiHelper(page, envConfig.apiBaseUrl);
        await api.patch(`/projects/${createdProjectId}`, { archived: true });
      } catch {
        // Best-effort cleanup
      }
    });

    /**
     * Helper: create a project and navigate to the dataset upload page.
     * Returns the project ID for cleanup.
     */
    async function createProjectAndGoToUpload(
      projectType: "object_detection" | "classification" | "segmentation",
      projectCreationPage: any,
      page: any
    ): Promise<string> {
      await projectCreationPage.goto();
      await projectCreationPage.selectType(projectType);
      await projectCreationPage.fillName(
        `Neg ${projectType} ${RUN_TAG}`
      );
      await projectCreationPage.clickSubmit();
      expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
      await projectCreationPage.clickUploadDatasetNow();
      await expect(page).toHaveURL(/\/dataset\/.+\/add/, {
        timeout: 15_000,
      });

      const url: string = page.url();
      const match = url.match(/\/dataset\/([^/]+)\//);
      return match ? match[1] : "";
    }

    // ─── Test 5: Invalid ZIP Structure ────────────────────────────────────

    test("invalid ZIP structure (missing train/test/val) — error dialog shown", async ({
      projectCreationPage,
      uploadDatasetPage,
      consoleErrors,
      page,
    }) => {
      createdProjectId = await createProjectAndGoToUpload(
        "object_detection",
        projectCreationPage,
        page
      );

      // Build a ZIP with random folders that don't match train/test/val
      const zip = new JSZip();
      zip.file("random_folder/file.txt", "not a dataset");
      zip.file("data/something.json", "{}");
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("labelled");
      await uploadDatasetPage.selectLabelFormat("yolo");
      await uploadDatasetPage.uploadZipFile(zipBuffer, "bad-structure.zip");

      // Validation should fail — either the retry button appears or an
      // error dialog is shown with "No train folder found"
      const retryVisible = await uploadDatasetPage
        .isRetryButtonVisible()
        .catch(() => false);

      if (!retryVisible) {
        await waitForDialogWithText(page, "No train folder found");
      } else {
        expect(retryVisible).toBe(true);
      }
      consoleErrors.assertNoErrors();
    });

    // ─── Test 6: Invalid YOLO Structure ───────────────────────────────────

    test("invalid YOLO structure (missing images/labels subfolders) — error dialog shown", async ({
      projectCreationPage,
      uploadDatasetPage,
      consoleErrors,
      page,
    }) => {
      createdProjectId = await createProjectAndGoToUpload(
        "object_detection",
        projectCreationPage,
        page
      );

      // Build a YOLO-like ZIP but without the images/ and labels/ subfolders
      const zip = new JSZip();
      zip.file("train/img_001.jpg", Buffer.alloc(100));
      zip.file("test/img_001.jpg", Buffer.alloc(100));
      zip.file("val/img_001.jpg", Buffer.alloc(100));
      zip.file("data.yaml", "nc: 1\nnames: [item]\n");
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("labelled");
      await uploadDatasetPage.selectLabelFormat("yolo");
      await uploadDatasetPage.uploadZipFile(zipBuffer, "bad-yolo.zip");

      // Validation should fail — missing images/ sub-folder
      const retryVisible = await uploadDatasetPage
        .isRetryButtonVisible()
        .catch(() => false);

      if (!retryVisible) {
        await waitForDialogWithText(page, "Missing");
      } else {
        expect(retryVisible).toBe(true);
      }
      consoleErrors.assertNoErrors();
    });

    // ─── Test 7: Invalid COCO Structure ───────────────────────────────────

    test("invalid COCO structure (missing annotations file) — error dialog shown", async ({
      projectCreationPage,
      uploadDatasetPage,
      consoleErrors,
      page,
    }) => {
      createdProjectId = await createProjectAndGoToUpload(
        "object_detection",
        projectCreationPage,
        page
      );

      // Build a COCO-like ZIP but without _annotations.coco.json
      const zip = new JSZip();
      zip.file("train/img_001.jpg", Buffer.alloc(100));
      zip.file("test/img_001.jpg", Buffer.alloc(100));
      zip.file("val/img_001.jpg", Buffer.alloc(100));
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("labelled");
      await uploadDatasetPage.selectLabelFormat("coco");
      await uploadDatasetPage.uploadZipFile(zipBuffer, "bad-coco.zip");

      // Validation should fail — missing _annotations.coco.json
      const retryVisible = await uploadDatasetPage
        .isRetryButtonVisible()
        .catch(() => false);

      if (!retryVisible) {
        await waitForDialogWithText(page, "annotations");
      } else {
        expect(retryVisible).toBe(true);
      }
      consoleErrors.assertNoErrors();
    });
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Block 4: Video & File Validation
// ═══════════════════════════════════════════════════════════════════════════════

test.describe(
  "Project Creation — Negative: Video & Files @project-creation @negative @file-validation",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    test.setTimeout(120_000);

    let createdProjectId: string | undefined;

    test.beforeEach(async ({ loginPage, projectCreationPage }) => {
      await loginPage.loginAs("admin");
      const error = await loginPage.getLoginErrorMessage();
      test.skip(!!error, `Login blocked by environment: ${error}`);
      createdProjectId = undefined;
    });

    test.afterEach(async ({ page }) => {
      if (!createdProjectId) return;
      try {
        const api = createApiHelper(page, envConfig.apiBaseUrl);
        await api.patch(`/projects/${createdProjectId}`, { archived: true });
      } catch {
        // Best-effort cleanup
      }
    });

    /**
     * Helper: create a project and navigate to the dataset upload page.
     */
    async function createProjectAndGoToUpload(
      projectType: "object_detection" | "classification" | "segmentation",
      projectCreationPage: any,
      page: any
    ): Promise<string> {
      await projectCreationPage.goto();
      await projectCreationPage.selectType(projectType);
      await projectCreationPage.fillName(
        `Neg-files ${projectType} ${RUN_TAG}`
      );
      await projectCreationPage.clickSubmit();
      expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
      await projectCreationPage.clickUploadDatasetNow();
      await expect(page).toHaveURL(/\/dataset\/.+\/add/, {
        timeout: 15_000,
      });

      const url: string = page.url();
      const match = url.match(/\/dataset\/([^/]+)\//);
      return match ? match[1] : "";
    }

    // ─── Test 8: Video > 180 seconds ──────────────────────────────────────

    test("video exceeding 180 seconds — error dialog shown", async ({
      projectCreationPage,
      uploadDatasetPage,
      consoleErrors,
      page,
    }) => {
      createdProjectId = await createProjectAndGoToUpload(
        "object_detection",
        projectCreationPage,
        page
      );

      // Mock the server validation response to return a video duration error.
      // For V2 projects, video validation is performed server-side.
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          (request.url().includes("validate") ||
            request.url().includes("dataset"))
        ) {
          await route.fulfill({
            status: 422,
            contentType: "application/json",
            body: JSON.stringify({
              message: "Video exceeds maximum duration of 3 minutes.",
            }),
          });
          return;
        }
        await route.continue();
      });

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("video");

      // Also mock client-side duration for browsers that parse the buffer
      await page.evaluate(() => {
        const origDuration = Object.getOwnPropertyDescriptor(
          HTMLVideoElement.prototype,
          "duration"
        );
        if (origDuration) {
          Object.defineProperty(
            HTMLVideoElement.prototype,
            "duration",
            {
              get() {
                const d = origDuration.get?.call(this);
                return d != null && !isNaN(d) && d !== Infinity ? d : 300;
              },
              configurable: true,
            }
          );
        }
      });

      const videoBuffer = createFakeVideoBuffer();
      await uploadDatasetPage.uploadVideoFile(videoBuffer, "long-video.mp4");

      // Wait for either the error dialog or the retry button
      await page.waitForTimeout(3_000);

      const dialogVisible = await page
        .locator(".dialog:visible")
        .first()
        .isVisible()
        .catch(() => false);
      const retryVisible = await uploadDatasetPage
        .isRetryButtonVisible()
        .catch(() => false);

      expect(dialogVisible || retryVisible).toBe(true);

      if (dialogVisible) {
        const text = await page
          .locator(".dialog:visible")
          .first()
          .textContent()
          .catch(() => "");
        // Should mention video duration or invalid dataset
        expect(
          text!.includes("Video exceeds") ||
            text!.includes("Invalid Dataset") ||
            text!.includes("duration") ||
            text!.includes("Invalid")
        ).toBe(true);
      }
      consoleErrors.assertNoErrors();

      await page.unroute("**/*");
    });

    // ─── Test 9: Insufficient Storage ─────────────────────────────────────

    test("insufficient storage — error dialog shown on dataset upload", async ({
      projectCreationPage,
      uploadDatasetPage,
      consoleErrors,
      page,
    }) => {
      createdProjectId = await createProjectAndGoToUpload(
        "object_detection",
        projectCreationPage,
        page
      );

      // Mock API to return storage limit error on any upload/validation POST
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          (request.url().includes("upload") ||
            request.url().includes("dataset") ||
            request.url().includes("validate"))
        ) {
          await route.fulfill({
            status: 422,
            contentType: "application/json",
            body: JSON.stringify({
              message:
                "You have reached your storage usage limit. Please contact the Tapway team to upgrade your subscription or explore other available options.",
            }),
          });
          return;
        }
        await route.continue();
      });

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("unlabelled");

      // Upload a tiny image to trigger the storage check
      await uploadDatasetPage.uploadFiles([
        {
          name: "trigger-storage-check.png",
          mimeType: "image/png",
          buffer: createFakePngBuffer(),
        },
      ]);

      // Wait for either the storage error dialog or an upload failure
      await page.waitForTimeout(3_000);

      const dialogVisible = await page
        .locator(".dialog:visible")
        .first()
        .isVisible()
        .catch(() => false);

      if (dialogVisible) {
        const text = await page
          .locator(".dialog:visible")
          .first()
          .textContent()
          .catch(() => "");
        expect(
          text!.includes("storage") || text!.includes("Storage")
        ).toBe(true);
      } else {
        // Upload may have failed without a dialog — check retry button or error state
        const retryVisible = await uploadDatasetPage
          .isRetryButtonVisible()
          .catch(() => false);
        const uploadDisabled = !(await uploadDatasetPage
          .isUploadButtonEnabled()
          .catch(() => false));
        expect(retryVisible || uploadDisabled).toBe(true);
      }
      consoleErrors.assertNoErrors();

      await page.unroute("**/*");
    });

    // ─── Test 12: Empty Unlabelled Upload ─────────────────────────────────

    test("empty unlabelled upload — rejected without files", async ({
      projectCreationPage,
      uploadDatasetPage,
      consoleErrors,
      page,
    }) => {
      createdProjectId = await createProjectAndGoToUpload(
        "object_detection",
        projectCreationPage,
        page
      );

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("unlabelled");

      // Without uploading any files, the upload button should be disabled
      // or clicking it should produce an error
      const isEnabled = await uploadDatasetPage
        .isUploadButtonEnabled()
        .catch(() => false);

      if (isEnabled) {
        // Try to submit — should show validation error
        await uploadDatasetPage.clickUploadDataset();
        await page.waitForTimeout(3_000);

        // Expect an error dialog about at least one image being required
        await waitForDialogWithText(
          page,
          "at least one image"
        );
      } else {
        // Upload button is correctly disabled when no files are selected
        expect(isEnabled).toBe(false);
      }
      consoleErrors.assertNoErrors();
    });

    // ─── Test 13: Wrong File Format ───────────────────────────────────────

    test("wrong file format (.pdf) — rejected by labelled upload input", async ({
      projectCreationPage,
      uploadDatasetPage,
      consoleErrors,
      page,
    }) => {
      createdProjectId = await createProjectAndGoToUpload(
        "object_detection",
        projectCreationPage,
        page
      );

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("labelled");
      await uploadDatasetPage.selectLabelFormat("yolo");

      // Try to upload a .pdf via the ZIP input (accept=".zip")
      const pdfBuffer = Buffer.from("%PDF-1.4 fake pdf content");
      const input = page
        .locator('#dataset-flow-upload-zip-input input[type="file"]')
        .first();
      await input.setInputFiles({
        name: "document.pdf",
        mimeType: "application/pdf",
        buffer: pdfBuffer,
      });

      // The component should reject it — either:
      // 1. An error dialog appears about invalid format
      // 2. The upload button stays disabled
      // 3. The retry button appears
      await page.waitForTimeout(3_000);

      const dialogVisible = await page
        .locator(".dialog:visible")
        .first()
        .isVisible()
        .catch(() => false);
      const retryVisible = await uploadDatasetPage
        .isRetryButtonVisible()
        .catch(() => false);
      const uploadEnabled = await uploadDatasetPage
        .isUploadButtonEnabled()
        .catch(() => false);

      // At least one rejection indicator should be present
      expect(dialogVisible || retryVisible || !uploadEnabled).toBe(true);
      consoleErrors.assertNoErrors();
    });
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Block 5: Training Validation
// ═══════════════════════════════════════════════════════════════════════════════

test.describe(
  "Project Creation — Negative: Training Validation @project-creation @negative @training-validation",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    // Extended timeout for project creation pipeline
    test.setTimeout(300_000);

    let createdProjectId: string | undefined;

    test.beforeEach(async ({ loginPage }) => {
      await loginPage.loginAs("admin");
      const error = await loginPage.getLoginErrorMessage();
      test.skip(!!error, `Login blocked by environment: ${error}`);
      createdProjectId = undefined;
    });

    test.afterEach(async ({ page }) => {
      if (!createdProjectId) return;
      try {
        const api = createApiHelper(page, envConfig.apiBaseUrl);
        await api.patch(`/projects/${createdProjectId}`, { archived: true });
      } catch {
        // Best-effort cleanup
      }
    });

    // ─── Test 10: Duplicate Model Name ────────────────────────────────────

    test("duplicate model name — rejected by fast training form", async ({
      projectCreationPage,
      uploadDatasetPage,
      labelingModeSelectionPage,
      labelingTaskCreationPage,
      trainPage,
      fastTrainingFormPage,
      consoleErrors,
      page,
    }) => {
      // Create project and run the full pipeline to reach the training page
      await projectCreationPage.goto();
      await projectCreationPage.selectType("object_detection");
      const projectName = `Dup Model ${RUN_TAG}`;
      await projectCreationPage.fillName(projectName);
      await projectCreationPage.clickSubmit();
      expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
      consoleErrors.assertNoErrors();

      await projectCreationPage.clickUploadDatasetNow();
      await expect(page).toHaveURL(/\/dataset\/.+\/add/, {
        timeout: 15_000,
      });

      const url1: string = page.url();
      const match1 = url1.match(/\/dataset\/([^/]+)\//);
      createdProjectId = match1 ? match1[1] : undefined;

      // Upload a valid YOLO dataset
      const { createYoloZip } = await import(
        "../../src/helpers/test-dataset-factory"
      );
      const zipBuffer = await createYoloZip(["item"]);

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("labelled");
      await uploadDatasetPage.selectLabelFormat("yolo");
      await uploadDatasetPage.uploadZipFile(zipBuffer);
      await uploadDatasetPage.waitForValidationComplete();
      await uploadDatasetPage.clickUploadDataset();
      consoleErrors.assertNoErrors();

      // Handle labeling mode if it appears
      const isLabelingMode = await labelingModeSelectionPage
        .isLoaded()
        .catch(() => false);
      if (isLabelingMode) {
        await labelingModeSelectionPage.selectMode("manual");
        await labelingModeSelectionPage.clickNext();
      }

      // Create labeling task
      await labelingTaskCreationPage.waitForReady();
      await labelingTaskCreationPage.fillTaskPrefix("dup-model");
      await labelingTaskCreationPage.clickCreate();
      await labelingTaskCreationPage.waitForSubmissionSuccess();
      await labelingTaskCreationPage.clickPublishDataset();
      consoleErrors.assertNoErrors();

      // Wait for training page
      await expect(page).toHaveURL(/\/project\/.+\/train/, {
        timeout: 30_000,
      });
      expect(await trainPage.isLoaded()).toBe(true);

      // Navigate to fast training
      await page.click('text="Fast Training"');
      await fastTrainingFormPage.waitForReady();
      expect(await fastTrainingFormPage.isLoaded()).toBe(true);

      const modelName = `dup-model-${RUN_TAG}`;
      await fastTrainingFormPage.fillModelName(modelName);
      await fastTrainingFormPage.fillModelDescription("First model");

      // Mock the training API to return a duplicate name error
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (
          request.method() === "POST" &&
          request.url().includes("train")
        ) {
          await route.fulfill({
            status: 422,
            contentType: "application/json",
            body: JSON.stringify({
              message:
                "Model name already exists. Please choose a different name.",
            }),
          });
          return;
        }
        await route.continue();
      });

      // Generate dataset version and attempt to start training
      if (
        await fastTrainingFormPage
          .isGenerateVersionButtonVisible()
          .catch(() => false)
      ) {
        await fastTrainingFormPage.clickGenerateVersion();
      } else {
        await fastTrainingFormPage.selectFirstDatasetVersion();
      }

      if (await fastTrainingFormPage.isStartButtonVisible().catch(() => false)) {
        await fastTrainingFormPage.clickStartTraining();
        await page.waitForTimeout(3_000);
      }

      // Check for error — either inline error or dialog
      const hasNameError = await fastTrainingFormPage
        .isModelNameErrorVisible()
        .catch(() => false);
      const dialogVisible = await page
        .locator(".dialog:visible")
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasNameError || dialogVisible).toBe(true);

      if (hasNameError) {
        const errorText =
          await fastTrainingFormPage.getModelNameError();
        expect(errorText.length).toBeGreaterThan(0);
      }
      consoleErrors.assertNoErrors();

      await page.unroute("**/*");
    });

    // ─── Test 11: Patience >= Epochs ──────────────────────────────────────

    test("patience >= epochs in advanced training — validation error shown", async ({
      projectCreationPage,
      uploadDatasetPage,
      labelingModeSelectionPage,
      labelingTaskCreationPage,
      trainPage,
      advanceTrainingFormPage,
      consoleErrors,
      page,
    }) => {
      // Create project and run pipeline to reach training page
      await projectCreationPage.goto();
      await projectCreationPage.selectType("object_detection");
      await projectCreationPage.fillName(`Patience ${RUN_TAG}`);
      await projectCreationPage.clickSubmit();
      expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
      consoleErrors.assertNoErrors();

      await projectCreationPage.clickUploadDatasetNow();
      await expect(page).toHaveURL(/\/dataset\/.+\/add/, {
        timeout: 15_000,
      });

      const url1: string = page.url();
      const match1 = url1.match(/\/dataset\/([^/]+)\//);
      createdProjectId = match1 ? match1[1] : undefined;

      const { createYoloZip } = await import(
        "../../src/helpers/test-dataset-factory"
      );
      const zipBuffer = await createYoloZip(["item"]);

      await uploadDatasetPage.waitForReady();
      await uploadDatasetPage.selectDatasetType("labelled");
      await uploadDatasetPage.selectLabelFormat("yolo");
      await uploadDatasetPage.uploadZipFile(zipBuffer);
      await uploadDatasetPage.waitForValidationComplete();
      await uploadDatasetPage.clickUploadDataset();
      consoleErrors.assertNoErrors();

      const isLabelingMode = await labelingModeSelectionPage
        .isLoaded()
        .catch(() => false);
      if (isLabelingMode) {
        await labelingModeSelectionPage.selectMode("manual");
        await labelingModeSelectionPage.clickNext();
      }

      await labelingTaskCreationPage.waitForReady();
      await labelingTaskCreationPage.fillTaskPrefix("pat-test");
      await labelingTaskCreationPage.clickCreate();
      await labelingTaskCreationPage.waitForSubmissionSuccess();
      await labelingTaskCreationPage.clickPublishDataset();
      consoleErrors.assertNoErrors();

      await expect(page).toHaveURL(/\/project\/.+\/train/, {
        timeout: 30_000,
      });
      expect(await trainPage.isLoaded()).toBe(true);

      // Navigate to advanced training
      await page.click('text="Advanced Training"');
      await advanceTrainingFormPage.waitForReady();
      expect(await advanceTrainingFormPage.isLoaded()).toBe(true);

      // Set epochs to a low value (10 is the minimum)
      const epochsInput = page
        .locator(".advance-training__input")
        .filter({ hasText: /epochs/i })
        .locator("input")
        .first();
      await epochsInput.fill("10");
      await epochsInput.press("Tab");
      await page.waitForTimeout(500);

      // Set patience to a value >= epochs (should trigger lessThanOther error)
      const patienceInput = page
        .locator(".advance-training__input")
        .filter({ hasText: /patience/i })
        .locator("input")
        .first();
      await patienceInput.fill("10");
      await patienceInput.press("Tab");
      await page.waitForTimeout(500);

      // The validation error "Value must be smaller than Train Epochs" should appear
      const errorSpan = page
        .locator(".advance-training__error")
        .first();
      await expect(errorSpan).toBeVisible({ timeout: 5_000 });

      const errorText = (await errorSpan.textContent()) || "";
      expect(errorText.toLowerCase()).toContain("smaller than");
      consoleErrors.assertNoErrors();
    });
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// Block 6: Sharing & Assignment
// ═══════════════════════════════════════════════════════════════════════════════

test.describe(
  "Project Creation — Negative: Sharing & Assignment @project-creation @negative @sharing",
  () => {
    test.skip(
      !envConfig.credentials.admin.username,
      "Admin credentials not configured in .env"
    );

    let createdProjectId: string | undefined;

    test.beforeEach(async ({ loginPage, projectCreationPage }) => {
      await loginPage.loginAs("admin");
      const error = await loginPage.getLoginErrorMessage();
      test.skip(!!error, `Login blocked by environment: ${error}`);
      await projectCreationPage.goto();
      createdProjectId = undefined;
    });

    test.afterEach(async ({ page }) => {
      if (!createdProjectId) return;
      try {
        const api = createApiHelper(page, envConfig.apiBaseUrl);
        await api.patch(`/projects/${createdProjectId}`, { archived: true });
      } catch {
        // Best-effort cleanup
      }
    });

    // ─── Test 14: Public Project Creation ─────────────────────────────────

    test("public project creation — sends public: true in API payload", async ({
      projectCreationPage,
      consoleErrors,
      page,
    }) => {
      await projectCreationPage.selectType("object_detection");
      await projectCreationPage.fillName(`Public ${RUN_TAG}`);

      // Switch from default "private" to "public"
      await projectCreationPage.selectSharing("public");

      // Intercept the createProjectBilling request
      let capturedPublic: boolean | undefined;

      page.on("request", (request) => {
        try {
          const postData = request.postData();
          if (!postData || !postData.includes("createProjectBilling")) return;

          const body = JSON.parse(postData);
          const projectInfoStr = body?.variables?.projectInfo;
          if (!projectInfoStr) return;

          const projectInfo = JSON.parse(projectInfoStr);
          capturedPublic = projectInfo.public;
        } catch {
          // Ignore parse errors from unrelated requests
        }
      });

      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);
      await projectCreationPage.clickSubmit();
      expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
      consoleErrors.assertNoErrors();

      // Verify the API received public: true
      expect(capturedPublic).toBe(true);

      // Extract project ID for cleanup
      await projectCreationPage.clickUploadDatasetNow();
      const url = page.url();
      const match = url.match(/\/dataset\/([^/]+)\//);
      createdProjectId = match ? match[1] : undefined;
    });

    // ─── Test 15: Labeler / Reviewer Assignment ───────────────────────────

    test("labeler and reviewer assignment — dropdowns functional and sent in API payload", async ({
      projectCreationPage,
      consoleErrors,
      page,
    }) => {
      await projectCreationPage.selectType("object_detection");
      await projectCreationPage.fillName(`Assign ${RUN_TAG}`);

      // Both dropdowns should be visible
      expect(
        await projectCreationPage.isLabelerDropdownVisible()
      ).toBe(true);
      expect(
        await projectCreationPage.isReviewerDropdownVisible()
      ).toBe(true);

      // Open the labeler dropdown and select the first available user
      const labelerSelect = page
        .locator(
          "#project-creation-default-labeler-dropdown .mat-mdc-select, #project-creation-default-labeler-dropdown mat-select"
        )
        .first();
      await labelerSelect.click();

      const panel = page
        .locator(
          ".cdk-overlay-pane .mat-mdc-select-panel, .mat-mdc-select-panel"
        )
        .first();
      await panel.waitFor({ state: "visible", timeout: 5_000 });

      const optionCount = await panel
        .locator(".mat-mdc-option")
        .count();
      if (optionCount > 0) {
        await panel.locator(".mat-mdc-option").first().click();
        await page.waitForTimeout(500);
      } else {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
      consoleErrors.assertNoErrors();

      // Intercept the createProjectBilling request
      let capturedLabelerId: string | undefined;
      let capturedReviewerId: string | undefined;

      page.on("request", (request) => {
        try {
          const postData = request.postData();
          if (!postData || !postData.includes("createProjectBilling")) return;

          const body = JSON.parse(postData);
          const projectInfoStr = body?.variables?.projectInfo;
          if (!projectInfoStr) return;

          const projectInfo = JSON.parse(projectInfoStr);
          capturedLabelerId = projectInfo.defaultLabelerId;
          capturedReviewerId = projectInfo.defaultReviewerId;
        } catch {
          // Ignore parse errors
        }
      });

      expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);
      await projectCreationPage.clickSubmit();
      expect(await projectCreationPage.isSuccessDialogVisible()).toBe(true);
      consoleErrors.assertNoErrors();

      // If a user was selected, the labeler ID should be set in the payload
      if (optionCount > 0) {
        expect(capturedLabelerId).toBeTruthy();
      }

      // Reviewer was not selected, so it should be empty/null
      expect(
        capturedReviewerId === undefined ||
          capturedReviewerId === null ||
          capturedReviewerId === ""
      ).toBe(true);

      // Extract project ID for cleanup
      await projectCreationPage.clickUploadDatasetNow();
      const url = page.url();
      const match = url.match(/\/dataset\/([^/]+)\//);
      createdProjectId = match ? match[1] : undefined;
    });
  }
);
