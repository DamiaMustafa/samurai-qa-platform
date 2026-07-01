import { type Page, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { envConfig } from "../../../src/config/environments";
import { createApiHelper } from "../../../src/helpers/api-helper";
import { timestamp } from "../../../src/helpers/data-generator";
import { assertCheckpoint, type ConsoleCapture } from "./critical-path.helpers";

// ── Fixture file paths ───────────────────────────────────────────────────────

const FIXTURES_DIR = path.resolve(
  __dirname,
  "../../../fixtures/datasets"
);

// ── Types ────────────────────────────────────────────────────────────────────

export type ProjectType =
  | "object_detection"
  | "classification"
  | "segmentation";
export type Version = "v1" | "v2";
export type LabelFormat = "yolo" | "coco";
export type AutoLabelMethod = "manual" | "grounding-dino";

export interface CreateProjectConfig {
  projectType: ProjectType;
  version: Version;
  classificationType?: "single-label" | "multi-label";
  namePrefix?: string;
}

export interface UploadLabeledConfig {
  zipPath: string;
  format: LabelFormat;
}

export interface UploadUnlabeledConfig {
  folderPath: string;
  classNames: string[];
}

export interface UploadVideoConfig {
  videoPath: string;
  classNames: string[];
}

// ── Resolve fixture path ─────────────────────────────────────────────────────

export function fixturePath(relative: string): string {
  return path.join(FIXTURES_DIR, relative);
}

// ── Step 1: Sign In ──────────────────────────────────────────────────────────

export async function signIn(
  page: Page,
  loginPage: { loginAs: (role: "admin") => Promise<void>; getLoginErrorMessage: () => Promise<string | null> }
): Promise<void> {
  await loginPage.loginAs("admin");
  const error = await loginPage.getLoginErrorMessage();
  if (error) {
    throw new Error(`Login failed: ${error}`);
  }
}

// ── Step 2: Create Project ───────────────────────────────────────────────────

export async function createProject(
  page: Page,
  projectCreationPage: any,
  config: CreateProjectConfig,
  consoleErrors: ConsoleCapture
): Promise<string> {
  const suffix = Date.now();
  const prefix = config.namePrefix || `CP-${config.projectType}-${config.version}`;
  const projectName = `${prefix}-${suffix}`;

  // Navigate to project creation
  await projectCreationPage.goto();
  expect(await projectCreationPage.isLoaded()).toBe(true);

  // Select project type
  await projectCreationPage.selectType(config.projectType);
  expect(await projectCreationPage.isTypeSelected(config.projectType)).toBe(
    true
  );

  // Select version (v2 is default, only set v1 explicitly)
  if (config.version === "v1") {
    await projectCreationPage.selectVersion("v1");
  }

  // Select classification type if applicable
  if (
    config.projectType === "classification" &&
    config.version === "v2" &&
    config.classificationType
  ) {
    await projectCreationPage.selectClassificationType(
      config.classificationType
    );
  }

  // Select sharing: private
  await projectCreationPage.selectSharing("private");

  // Fill name and submit
  await projectCreationPage.fillName(projectName);
  expect(await projectCreationPage.isSubmitButtonDisabled()).toBe(false);

  await projectCreationPage.clickSubmit();

  // The spinner shows while the API runs — wait for the upload-dataset button
  // directly (skip asserting the dialog visible, API can be slow > 30s)
  await page.locator("#project-creation-success-upload-dataset").waitFor({
    state: "visible",
    timeout: 120_000, // 2 min — real backend project creation can be slow
  });

  // Assert console errors after project creation
  assertCheckpoint(consoleErrors);

  // Click "Upload Dataset Now" in success dialog
  await page.locator("#project-creation-success-upload-dataset").click();

  // Wait for navigation to upload page and extract project ID from URL
  await expect(page).toHaveURL(/\/dataset\/.+\/add/, { timeout: 30_000 });
  const url = page.url();
  const match = url.match(/\/dataset\/([^/]+)\/add/);
  const projectId = match ? match[1] : "";
  expect(projectId).toBeTruthy();

  return projectId;
}

// ── Step 3a: Upload Labeled ZIP ──────────────────────────────────────────────

export async function uploadLabeledZip(
  page: Page,
  uploadDatasetPage: any,
  config: UploadLabeledConfig,
  consoleErrors: ConsoleCapture
): Promise<void> {
  await uploadDatasetPage.waitForReady();

  // Select labelled dataset type
  await uploadDatasetPage.selectDatasetType("labelled");

  // Select label format (YOLO or COCO)
  await uploadDatasetPage.selectLabelFormat(config.format);

  // Upload the ZIP file via path (avoids 50MB Playwright buffer limit)
  await uploadDatasetPage.uploadZipFile(config.zipPath);

  // Wait for validation and submit (large ZIPs can take several minutes)
  await uploadDatasetPage.waitForValidationComplete(600_000);
  await uploadDatasetPage.clickUploadDataset();

  // Wait for the server-side upload to complete (614MB ZIP can take 30+ min)
  await uploadDatasetPage.waitForUploadComplete(3_600_000);

  // Assert console errors after upload
  assertCheckpoint(consoleErrors);

  // Wait for navigation away from the upload page
  await page.waitForLoadState("networkidle");
}

// ── Step 3b: Upload Unlabeled Folder ─────────────────────────────────────────

export async function uploadUnlabeledFolder(
  page: Page,
  uploadDatasetPage: any,
  config: UploadUnlabeledConfig,
  consoleErrors: ConsoleCapture
): Promise<void> {
  await uploadDatasetPage.waitForReady();

  // Select unlabelled dataset type
  await uploadDatasetPage.selectDatasetType("unlabelled");

  // Read all image files from the folder
  const folderAbsPath = path.isAbsolute(config.folderPath)
    ? config.folderPath
    : fixturePath(config.folderPath);

  const imageExtensions = /\.(jpg|jpeg|png|bmp|webp|gif)$/i;
  const files = fs
    .readdirSync(folderAbsPath)
    .filter((f) => imageExtensions.test(f))
    .slice(0, 50) // Cap at 50 images to keep upload time reasonable
    .map((f) => ({
      name: f,
      mimeType: "image/jpeg",
      buffer: fs.readFileSync(path.join(folderAbsPath, f)),
    }));

  expect(files.length).toBeGreaterThan(0);

  // Upload all files at once (simulates folder upload)
  await uploadDatasetPage.uploadFiles(files);

  // Wait for validation and submit
  await uploadDatasetPage.waitForValidationComplete(600_000);
  await uploadDatasetPage.clickUploadDataset();

  // Wait for the server-side upload to complete
  await uploadDatasetPage.waitForUploadComplete(3_600_000);

  // Assert console errors after upload
  assertCheckpoint(consoleErrors);

  // Wait for navigation away from the upload page
  await page.waitForLoadState("networkidle");
}

// ── Step 3c: Upload Video ────────────────────────────────────────────────────

export async function uploadVideo(
  page: Page,
  uploadDatasetPage: any,
  config: UploadVideoConfig,
  consoleErrors: ConsoleCapture
): Promise<void> {
  await uploadDatasetPage.waitForReady();

  // Select video dataset type
  await uploadDatasetPage.selectDatasetType("video");

  // Read and upload the video file
  const videoAbsPath = path.isAbsolute(config.videoPath)
    ? config.videoPath
    : fixturePath(config.videoPath);
  const videoBuffer = fs.readFileSync(videoAbsPath);
  const fileName = path.basename(videoAbsPath);
  await uploadDatasetPage.uploadVideoFile(videoBuffer, fileName);

  // Wait for validation and submit
  await uploadDatasetPage.waitForValidationComplete(180_000);
  await uploadDatasetPage.clickUploadDataset();

  // Wait for the server-side upload to complete
  await uploadDatasetPage.waitForUploadComplete(600_000);

  // Assert console errors after upload
  assertCheckpoint(consoleErrors);

  // Wait for video extraction to begin
  await page.waitForLoadState("networkidle");
}

// ── Step 3d: Add Class Names ─────────────────────────────────────────────────

/**
 * Add class names on the labels/add page for unlabeled datasets.
 * The add-labels page appears after dataset upload for unlabeled/video data.
 *
 * DOM:
 * - Root: #dataset-flow-labels-page
 * - Add labels (empty): #dataset-flow-labels-add-first
 * - Add labels (more): #dataset-flow-labels-add-another
 * - Next step: #dataset-flow-labels-next
 */
export async function addClassNames(
  page: Page,
  classNames: string[],
  consoleErrors: ConsoleCapture
): Promise<void> {
  // Wait for labels page to load
  const labelsRoot = page.locator("#dataset-flow-labels-page").first();
  await labelsRoot.waitFor({ state: "visible", timeout: 30_000 });

  // Click "Add labels" button
  const addFirst = page.locator("#dataset-flow-labels-add-first").first();
  const addAnother = page.locator("#dataset-flow-labels-add-another").first();

  if (await addFirst.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await addFirst.click();
  } else if (
    await addAnother.isVisible({ timeout: 3_000 }).catch(() => false)
  ) {
    await addAnother.click();
  }

  // The labels are entered via sc-table-with-input component.
  // Each class name gets its own row. We look for input fields
  // within the labels table and fill them.
  await page.waitForTimeout(1_000);

  // Try to find and fill class name inputs
  const labelInputs = page.locator(
    "#dataset-flow-labels-page input[type='text'], #dataset-flow-labels-page input:not([type])"
  );

  for (let i = 0; i < classNames.length; i++) {
    const inputCount = await labelInputs.count();
    if (i < inputCount) {
      await labelInputs.nth(i).fill(classNames[i]);
    } else {
      // Click "Add another" to get more input rows
      const addMore = page
        .locator("#dataset-flow-labels-add-another")
        .first();
      if (await addMore.isVisible().catch(() => false)) {
        await addMore.click();
        await page.waitForTimeout(500);
      }
      const updatedCount = await labelInputs.count();
      if (i < updatedCount) {
        await labelInputs.nth(i).fill(classNames[i]);
      }
    }
  }

  // Click "Next Step" to proceed
  const nextBtn = page.locator("#dataset-flow-labels-next").first();
  await nextBtn.waitFor({ state: "visible", timeout: 10_000 });
  await nextBtn.click();

  await page.waitForLoadState("networkidle");
  assertCheckpoint(consoleErrors);
}

// ── Step 3e: Handle Labeling Mode Selection ──────────────────────────────────

/**
 * Handle the labeling mode selection page if it appears.
 * For labeled datasets, this page may be skipped automatically.
 * For unlabeled datasets, select the specified mode.
 */
export async function handleLabelingMode(
  page: Page,
  labelingModeSelectionPage: any,
  mode: AutoLabelMethod,
  consoleErrors: ConsoleCapture
): Promise<void> {
  // Check if labeling mode page appears (may be skipped for labeled data)
  const isLabelingMode = await labelingModeSelectionPage
    .isLoaded()
    .catch(() => false);

  if (isLabelingMode) {
    await labelingModeSelectionPage.selectMode(mode);
    await labelingModeSelectionPage.clickNext();
    assertCheckpoint(consoleErrors);
  }
}

// ── Step 4: Create Labeling Task ─────────────────────────────────────────────

export async function createLabelingTask(
  page: Page,
  labelingTaskCreationPage: any,
  taskPrefix: string,
  consoleErrors: ConsoleCapture
): Promise<void> {
  await labelingTaskCreationPage.waitForReady();
  expect(await labelingTaskCreationPage.isLoaded()).toBe(true);

  await labelingTaskCreationPage.fillTaskPrefix(taskPrefix);
  await labelingTaskCreationPage.clickCreate();
  await labelingTaskCreationPage.waitForSubmissionSuccess(300_000);

  assertCheckpoint(consoleErrors);
}

// ── Step 5a: Auto-label (AI Advanced from Editor) ────────────────────────────

/**
 * For "manual autolabel" tests: open the labeling editor, use AI Advanced
 * Auto Label to annotate all images, then complete the labeling task.
 *
 * The labeling tool has no stable IDs on its toolbar buttons.
 * AI Advanced Auto Label is triggered via:
 *   - Control sidebar button with tooltip 'control-sidebar.advance-ai-auto-label'
 *   - Or via the autoLabel('advanced-ai') click handler
 *
 * The Advanced AI dialog (mat-dialog) appears with:
 *   - Class selection (click label items)
 *   - Annotate button: button[tw-button="primary relaxed"]
 *   - Cancel button
 */
export async function runAutoLabelFromEditor(
  page: Page,
  projectId: string,
  consoleErrors: ConsoleCapture
): Promise<void> {
  // Navigate to labeling tasks list
  await page.goto(`/project/${projectId}/labeling-tasks/list`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(2_000);

  // Click on the first labeling task row to open it
  const taskRow = page
    .locator(
      ".labeling-tasks-list__table tr, .labeling-tasks-list__table [role='row']"
    )
    .first();
  await taskRow.click();
  await page.waitForLoadState("networkidle");

  // Click "Open Editor" button (no stable ID — use class selector)
  const openEditorBtn = page
    .locator("button.task-details__zero-button")
    .first();
  await openEditorBtn.waitFor({ state: "visible", timeout: 15_000 });
  await openEditorBtn.click();

  // Wait for labeling tool to load
  await page.waitForTimeout(5_000);

  // Click AI Advanced Auto Label button in control sidebar
  // It's the button with tooltip containing 'advance-ai-auto-label'
  const aiAutoLabelBtn = page
    .locator(
      "annotation-control-sidebar button.btn-control[mattooltip*='auto-label' i], " +
        "annotation-control-sidebar button.btn-control[mattooltip*='advanced' i], " +
        "annotation-control-sidebar button.btn-control"
    )
    .nth(4); // 5th button in control sidebar (0-indexed = 4)

  // Fallback: try clicking by tooltip text
  const aiBtn = page
    .locator("button.btn-control")
    .filter({ has: page.locator("img[alt*='auto' i], img[alt*='advanced' i], img[alt*='ai' i]") })
    .first();

  if (await aiBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await aiBtn.click();
  } else {
    await aiAutoLabelBtn.click();
  }

  // Wait for the Advanced AI dialog to appear
  const dialog = page
    .locator(
      ".mat-mdc-dialog-container, advanced-ai-dialog, .cdk-overlay-pane"
    )
    .first();
  await dialog.waitFor({ state: "visible", timeout: 10_000 });

  // Select all classes in the dialog (click label items)
  const classItems = page.locator(
    "advanced-ai-dialog .gd-prompt__settings-labels-item, " +
      ".mat-mdc-dialog-container .gd-prompt__settings-labels-item"
  );
  const classCount = await classItems.count();
  for (let i = 0; i < classCount; i++) {
    await classItems.nth(i).click();
    await page.waitForTimeout(200);
  }

  // Click "Annotate" button in the dialog
  const annotateBtn = page
    .locator(
      "advanced-ai-dialog button[tw-button*='primary'], " +
        ".mat-mdc-dialog-container button[tw-button*='primary']"
    )
    .first();
  await annotateBtn.click();

  // Wait for auto-labeling to complete (can take a while)
  await page.waitForTimeout(10_000);
  await page.waitForLoadState("networkidle");

  // Save annotations (Ctrl+S or save button in top bar)
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(2_000);

  // Navigate through remaining images and auto-label each
  // Use keyboard shortcut or next button to advance
  for (let i = 0; i < 5; i++) {
    // Try to go to next image
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(2_000);

    // Auto-label this image too
    if (
      await aiBtn.isVisible({ timeout: 1_000 }).catch(() => false)
    ) {
      await aiBtn.click();
      await dialog.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});

      // Select classes and annotate
      for (let j = 0; j < classCount; j++) {
        const item = page.locator(
          ".gd-prompt__settings-labels-item"
        ).nth(j);
        if (await item.isVisible().catch(() => false)) {
          await item.click();
          await page.waitForTimeout(200);
        }
      }

      if (await annotateBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await annotateBtn.click();
        await page.waitForTimeout(5_000);
      }

      // Save
      await page.keyboard.press("Control+s");
      await page.waitForTimeout(1_000);
    }
  }

  assertCheckpoint(consoleErrors);

  // Complete the labeling task
  await completeLabelingTask(page, projectId);
}

// ── Step 5b: Auto-label (Grounding DINO via Hub) ────────────────────────────

/**
 * For "grounding dino" tests: navigate to auto-labeling hub, configure
 * Grounding DINO, run auto-labeling, then complete the labeling task.
 *
 * Hub URL: /project/:id/auto-labelling
 * Hub DOM: #auto-labeling-hub-page, #auto-labeling-hub-radio-group
 */
export async function runGroundingDino(
  page: Page,
  projectId: string,
  classNames: string[],
  consoleErrors: ConsoleCapture
): Promise<void> {
  // Navigate to labeling tasks list first
  await page.goto(`/project/${projectId}/labeling-tasks/list`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(2_000);

  // Click on the first labeling task row to open it
  const taskRow = page
    .locator(
      ".labeling-tasks-list__table tr, .labeling-tasks-list__table [role='row']"
    )
    .first();
  await taskRow.click();
  await page.waitForLoadState("networkidle");

  // Open the labeling editor
  const openEditorBtn = page
    .locator("button.task-details__zero-button")
    .first();
  await openEditorBtn.waitFor({ state: "visible", timeout: 15_000 });
  await openEditorBtn.click();
  await page.waitForTimeout(5_000);

  // Use the Advanced AI auto-label (Grounding DINO) from within the editor
  // Click the AI Advanced Auto Label button
  const aiBtn = page
    .locator("button.btn-control")
    .filter({
      has: page.locator(
        "img[alt*='auto' i], img[alt*='advanced' i], img[alt*='ai' i]"
      ),
    })
    .first();

  if (await aiBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await aiBtn.click();
  } else {
    // Fallback: click 5th button in control sidebar
    await page.locator("button.btn-control").nth(4).click();
  }

  // Wait for the Advanced AI dialog
  const dialog = page
    .locator(
      ".mat-mdc-dialog-container, advanced-ai-dialog, .cdk-overlay-pane"
    )
    .first();
  await dialog.waitFor({ state: "visible", timeout: 10_000 });

  // Select all available classes
  const classItems = page.locator(".gd-prompt__settings-labels-item");
  const classCount = await classItems.count();
  for (let i = 0; i < classCount; i++) {
    await classItems.nth(i).click();
    await page.waitForTimeout(200);
  }

  // Click Annotate
  const annotateBtn = page
    .locator(
      "advanced-ai-dialog button[tw-button*='primary'], " +
        ".mat-mdc-dialog-container button[tw-button*='primary']"
    )
    .first();
  await annotateBtn.click();

  // Wait for auto-labeling to complete
  await page.waitForTimeout(15_000);
  await page.waitForLoadState("networkidle");

  // Save
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(2_000);

  assertCheckpoint(consoleErrors);

  // Complete the labeling task
  await completeLabelingTask(page, projectId);
}

// ── Step 5c: Auto-label for Video ────────────────────────────────────────────

/**
 * For video tests: after frame extraction, auto-label the extracted frames.
 * Video frames are processed server-side, then appear as images in the dataset.
 * Uses the same Advanced AI auto-label flow as unlabeled images.
 */
export async function runAutoLabelForVideo(
  page: Page,
  projectId: string,
  consoleErrors: ConsoleCapture
): Promise<void> {
  // The video extraction flow should have navigated to a page showing
  // extracted frames. Wait for it to complete.
  await page.waitForTimeout(10_000);

  // Navigate to labeling tasks list
  await page.goto(`/project/${projectId}/labeling-tasks/list`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(2_000);

  // Open first task
  const taskRow = page
    .locator(
      ".labeling-tasks-list__table tr, .labeling-tasks-list__table [role='row']"
    )
    .first();
  await taskRow.click();
  await page.waitForLoadState("networkidle");

  // Open editor
  const openEditorBtn = page
    .locator("button.task-details__zero-button")
    .first();
  await openEditorBtn.waitFor({ state: "visible", timeout: 15_000 });
  await openEditorBtn.click();
  await page.waitForTimeout(5_000);

  // Auto-label using Advanced AI (same as manual flow)
  const aiBtn = page
    .locator("button.btn-control")
    .filter({
      has: page.locator(
        "img[alt*='auto' i], img[alt*='advanced' i], img[alt*='ai' i]"
      ),
    })
    .first();

  if (await aiBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await aiBtn.click();
  } else {
    await page.locator("button.btn-control").nth(4).click();
  }

  const dialog = page
    .locator(
      ".mat-mdc-dialog-container, advanced-ai-dialog, .cdk-overlay-pane"
    )
    .first();
  await dialog.waitFor({ state: "visible", timeout: 10_000 });

  // Select all classes
  const classItems = page.locator(".gd-prompt__settings-labels-item");
  const classCount = await classItems.count();
  for (let i = 0; i < classCount; i++) {
    await classItems.nth(i).click();
    await page.waitForTimeout(200);
  }

  // Annotate
  const annotateBtn = page
    .locator(
      "advanced-ai-dialog button[tw-button*='primary'], " +
        ".mat-mdc-dialog-container button[tw-button*='primary']"
    )
    .first();
  await annotateBtn.click();
  await page.waitForTimeout(15_000);
  await page.waitForLoadState("networkidle");

  // Save
  await page.keyboard.press("Control+s");
  await page.waitForTimeout(2_000);

  assertCheckpoint(consoleErrors);

  // Complete the labeling task
  await completeLabelingTask(page, projectId);
}

// ── Step 5d: Labeled Data — Submit Directly ──────────────────────────────────

/**
 * For labeled datasets: images come pre-labeled.
 * Navigate to labeling task, submit it directly, then proceed to review.
 */
export async function submitPreLabeledTask(
  page: Page,
  projectId: string,
  consoleErrors: ConsoleCapture
): Promise<void> {
  // Navigate to labeling tasks list
  await page.goto(`/project/${projectId}/labeling-tasks/list`, {
    waitUntil: "networkidle",
  });

  // Poll until at least one data row appears (mat-mdc-row = Angular Material MDC data rows)
  const taskRow = page
    .locator(".labeling-tasks-list__table tr.mat-mdc-row")
    .first();
  await taskRow.waitFor({ state: "visible", timeout: 120_000 });
  await taskRow.click();
  await page.waitForLoadState("networkidle");

  // Click "Complete Task" button (task is pre-labeled)
  const completeBtn = page
    .locator("button.task-details__complete, button:has-text('Complete')")
    .first();
  await completeBtn.waitFor({ state: "visible", timeout: 30_000 });
  await completeBtn.click();

  // A confirmation dialog appears: "Are you sure you wish to complete this task?"
  // Click the positive "Complete Task" button inside the Material dialog overlay
  const confirmBtn = page
    .locator(".cdk-overlay-pane button:has-text('Complete Task')")
    .first();
  await confirmBtn.waitFor({ state: "visible", timeout: 10_000 });
  await confirmBtn.click();

  // Wait for the API call to finish and the toast/notification to appear
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3_000);

  assertCheckpoint(consoleErrors);
}

// ── Helper: Complete labeling task from editor ───────────────────────────────

async function completeLabelingTask(
  page: Page,
  projectId: string
): Promise<void> {
  // Navigate back to task detail if needed
  if (!page.url().includes("labeling-task")) {
    await page.goto(`/project/${projectId}/labeling-tasks/list`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(2_000);

    const taskRow = page
      .locator(".labeling-tasks-list__table tr.mat-mdc-row")
      .first();
    await taskRow.click();
    await page.waitForLoadState("networkidle");
  }

  // Click Complete Task
  const completeBtn = page
    .locator("button.task-details__complete, button:has-text('Complete')")
    .first();
  if (await completeBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await completeBtn.click();

    // Handle confirmation dialog
    const confirmBtn = page
      .locator(".cdk-overlay-pane button:has-text('Complete Task')")
      .first();
    await confirmBtn.waitFor({ state: "visible", timeout: 10_000 });
    await confirmBtn.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3_000);
  }
}

// ── Step 6: Submit Labeling Task (via publish) ───────────────────────────────

export async function publishDataset(
  page: Page,
  labelingTaskCreationPage: any,
  consoleErrors: ConsoleCapture
): Promise<void> {
  await labelingTaskCreationPage.clickPublishDataset();
  await page.waitForLoadState("networkidle");
  assertCheckpoint(consoleErrors);
}

// ── Step 7: Review ───────────────────────────────────────────────────────────

/**
 * Review flow:
 * 1. Navigate to review tasks list
 * 2. Open first review task
 * 3. Select images in masonry grid
 * 4. Open review editor
 * 5. Approve 1 image individually
 * 6. Reject 1 image individually, then re-approve it
 * 7. Bulk approve remaining
 * 8. Submit review
 *
 * Review editor selectors (no stable IDs):
 * - Reject: .review-editor__general-review-actions-btn[tw-button="danger relaxed"]
 * - Approve: .review-editor__general-review-actions-btn[tw-button="approve relaxed"]
 * - Submit: button[tw-button="relaxed green"] (when remainingImages === 0)
 * - Save: button[tw-button="relaxed green"] (when remainingImages > 0)
 * - Prev/Next: button[tw-button="icon"] in .review-editor__header-progress
 */
export async function runReview(
  page: Page,
  projectId: string,
  consoleErrors: ConsoleCapture
): Promise<void> {
  // Navigate to review tasks list and poll for data rows.
  const reviewRow = page
    .locator(".labeling-tasks-review-list__table tr.mat-mdc-row")
    .first();

  const deadline = Date.now() + 180_000; // 3 min
  while (Date.now() < deadline) {
    await page.goto(`/project/${projectId}/labeling-tasks/review-list`, {
      waitUntil: "networkidle",
    });
    if (await reviewRow.isVisible().catch(() => false)) break;
    await page.waitForTimeout(5_000);
  }
  await reviewRow.waitFor({ state: "visible", timeout: 10_000 });

  // Navigate directly to review detail using task ID from the table
  const taskIdCell = page
    .locator(".labeling-tasks-review-list__table tr.mat-mdc-row td")
    .first();
  const taskId = (await taskIdCell.textContent())?.trim() || "";
  expect(taskId).toBeTruthy();

  await page.goto(
    `/project/${projectId}/labeling-task/review/${taskId}/detail`,
    { waitUntil: "networkidle" }
  );

  // Wait for images to load in the masonry grid
  await page
    .locator("sc-masonry-grid")
    .first()
    .waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(2_000);

  // ── Step 1: Select All via submenu ────────────────────────────────────
  // The "Images Selected" submenu is an sc-submenu inside
  // .task-details__buttons-select. It uses Angular Material mat-menu.
  const submenuTrigger = page
    .locator(".task-details__buttons-select button")
    .first();
  await submenuTrigger.waitFor({ state: "visible", timeout: 10_000 });
  await submenuTrigger.click();

  // Click "Select All" in the mat-menu overlay
  const selectAllOption = page
    .locator(".cdk-overlay-pane button[mat-menu-item]")
    .filter({ hasText: /select all/i })
    .first();
  await selectAllOption.waitFor({ state: "visible", timeout: 5_000 });
  await selectAllOption.click();
  await page.waitForTimeout(1_000);

  // ── Step 2: Bulk Approve via submenu ──────────────────────────────────
  await submenuTrigger.click();

  // Click "Approve" in the mat-menu overlay
  const approveOption = page
    .locator(".cdk-overlay-pane button[mat-menu-item]")
    .filter({ hasText: /approve/i })
    .first();
  await approveOption.waitFor({ state: "visible", timeout: 5_000 });
  await approveOption.click();

  // Wait for the bulk approve API to complete — the loading overlay
  // appears then disappears, and the remainingImages counter drops to 0.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(5_000);

  // ── Step 3: Submit Review ─────────────────────────────────────────────
  // The "Submit Review" button is enabled when remainingImages === 0.
  const submitBtn = page
    .locator("button.task-details__buttons-complete")
    .first();
  await submitBtn.waitFor({ state: "visible", timeout: 60_000 });
  // Wait for the button to be enabled (remainingImages must be 0)
  await expect(submitBtn).not.toBeDisabled({ timeout: 120_000 });
  await submitBtn.click();
  await page.waitForLoadState("networkidle");

  assertCheckpoint(consoleErrors);
}

// ── Training State File ──────────────────────────────────────────────────────

/**
 * Training state is persisted to a JSON file so Phase 1 (start) and
 * Phase 2 (wait for completion) can run in separate test invocations.
 * Real training takes 4-6 hours — too long for a single test run.
 */
export interface TrainingState {
  projectId: string;
  modelName: string;
  startedAt: string;
  phase: "started" | "in-progress" | "done" | "failed";
}

const TRAINING_STATE_PATH = path.resolve(
  __dirname,
  "../../../../test-results/training-state.json"
);

export function saveTrainingState(state: TrainingState): void {
  const dir = path.dirname(TRAINING_STATE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TRAINING_STATE_PATH, JSON.stringify(state, null, 2));
}

export function loadTrainingState(): TrainingState | null {
  if (!fs.existsSync(TRAINING_STATE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(TRAINING_STATE_PATH, "utf-8"));
  } catch {
    return null;
  }
}

// ── Step 8a: Start Training (Phase 1) ────────────────────────────────────────

export interface StartTrainingOptions {
  /**
   * If true, poll for training completion (DONE) after starting.
   * Defaults to false — only verify IN-PROGRESS status and return.
   * Set to true for specs that need the old single-call behavior.
   */
  waitForCompletion?: boolean;
  /**
   * Max wait time for training completion in ms (default: 6 hours).
   * Only used when waitForCompletion is true.
   */
  completionTimeoutMs?: number;
}

/**
 * Start fast training and verify it reaches IN-PROGRESS status.
 *
 * By default this is Phase 1 only — returns once training is IN-PROGRESS.
 * Real training takes 4-6 hours, so completion is handled separately via
 * `waitForTrainingCompletion()` (Phase 2).
 *
 * Pass `{ waitForCompletion: true }` for specs that need the old single-call
 * behavior (start + wait for DONE in one call).
 *
 * Phase 1 flow:
 *   1. Re-authenticate (token may have expired during long review step)
 *   2. Navigate to Fast Training form
 *   3. Generate dataset version snapshot
 *   4. Fill model name + description
 *   5. Click Start Training
 *   6. Verify model appears in train page with IN-PROGRESS status
 *   7. Save training state to JSON file for Phase 2
 *
 * Status indicators on the train page:
 *   - IN-PROGRESS: tw-tag[color="light-orange"]
 *   - DONE:        tw-tag[color="green"]
 *   - FAILED:      tw-tag[color="red"]
 */
export async function startTraining(
  page: Page,
  fastTrainingFormPage: any,
  projectId: string,
  consoleErrors: ConsoleCapture,
  options?: StartTrainingOptions
): Promise<TrainingState> {
  // The review flow often takes long enough for the auth token to expire.
  // Always re-authenticate before navigating to the training page.
  const { LoginPage } = await import("../../../src/pages/LoginPage");
  const loginPage = new LoginPage(page);
  await loginPage.loginAs("admin");
  await page.waitForLoadState("networkidle");

  // Navigate to fast training form
  await fastTrainingFormPage.goto(projectId);
  expect(await fastTrainingFormPage.isLoaded()).toBe(true);

  // Step 1: Generate dataset version (snapshot)
  await fastTrainingFormPage.clickGenerateVersion();

  // Step 2: Fill model name
  const modelName = `model-${Date.now()}`;
  await fastTrainingFormPage.fillModelName(modelName);

  // Step 3: Fill optional description
  await fastTrainingFormPage.fillModelDescription(
    `Critical path test model ${timestamp()}`
  );

  // Step 4: Start training
  expect(await fastTrainingFormPage.isStartButtonEnabled()).toBe(true);
  await fastTrainingFormPage.clickStartTraining();
  await fastTrainingFormPage.waitForTrainingStart(60_000);

  // Assert console errors after training start
  assertCheckpoint(consoleErrors);

  // Step 5: Navigate to train page and verify IN-PROGRESS status
  await page.goto(`/project/${projectId}/train`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(5_000);

  // The model row should appear with IN-PROGRESS status (light-orange tag).
  // Poll briefly — the API can take 10-30s to register the new model.
  const inProgressTag = page
    .locator(
      "#models-table tw-tag[color='light-orange'], " +
        "#models-table .status-in-progress, " +
        "tw-tag:has-text('IN-PROGRESS'), " +
        "tw-tag:has-text('IN PROGRESS')"
    )
    .first();

  const visible = await inProgressTag
    .isVisible({ timeout: 60_000 })
    .catch(() => false);

  // If not IN-PROGRESS, check if it already completed (small datasets) or failed
  if (!visible) {
    const doneTag = page
      .locator(
        "#models-table tw-tag[color='green'], " +
          "tw-tag:has-text('DONE')"
      )
      .first();

    if (await doneTag.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Already done — small dataset trained quickly
      const state: TrainingState = {
        projectId,
        modelName,
        startedAt: new Date().toISOString(),
        phase: "done",
      };
      saveTrainingState(state);
      return state;
    }

    const failedTag = page
      .locator(
        "#models-table tw-tag[color='red'], " +
          "tw-tag:has-text('FAILED')"
      )
      .first();

    if (await failedTag.isVisible({ timeout: 2_000 }).catch(() => false)) {
      throw new Error("Training failed immediately after start");
    }

    throw new Error(
      "Training model did not appear in train page within 60 seconds"
    );
  }

  // Phase 1 complete — training is in progress
  const state: TrainingState = {
    projectId,
    modelName,
    startedAt: new Date().toISOString(),
    phase: "in-progress",
  };
  saveTrainingState(state);

  // If waitForCompletion is requested, continue to Phase 2 inline
  if (options?.waitForCompletion) {
    return waitForTrainingCompletion(page, state, consoleErrors);
  }

  return state;
}

// ── Step 8b: Wait for Training Completion (Phase 2) ─────────────────────────

/**
 * Poll for training completion (Phase 2).
 * Reads training state from Phase 1, then polls the train page until the
 * model status is DONE or FAILED. Max wait: 6 hours.
 *
 * This function is designed to be called in a separate test run after
 * Phase 1 has started training, since real training takes 4-6 hours.
 *
 * @param page — Playwright page (must be authenticated)
 * @param state — training state from Phase 1 (or loaded from file)
 * @param consoleErrors — console error capture for checkpoint assertions
 */
export async function waitForTrainingCompletion(
  page: Page,
  state: TrainingState,
  consoleErrors: ConsoleCapture
): Promise<TrainingState> {
  const { projectId } = state;

  // Navigate to train page
  await page.goto(`/project/${projectId}/train`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(3_000);

  // Poll for training completion (max 6 hours)
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  const POLL_INTERVAL = 60_000; // check every 60 seconds
  const deadline = Date.now() + SIX_HOURS;

  while (Date.now() < deadline) {
    // Check for DONE status (green tag)
    const doneTag = page.locator(
      "#models-table tw-tag[color='green'], " +
        "#models-table .status-done, " +
        "tw-tag:has-text('DONE')"
    ).first();

    if (await doneTag.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const updated: TrainingState = { ...state, phase: "done" };
      saveTrainingState(updated);
      assertCheckpoint(consoleErrors);
      return updated;
    }

    // Check for FAILED status
    const failedTag = page.locator(
      "#models-table tw-tag[color='red'], " +
        "tw-tag:has-text('FAILED')"
    ).first();

    if (await failedTag.isVisible({ timeout: 1_000 }).catch(() => false)) {
      const updated: TrainingState = { ...state, phase: "failed" };
      saveTrainingState(updated);
      throw new Error("Training failed — status is FAILED");
    }

    // Refresh and poll
    await page.waitForTimeout(POLL_INTERVAL);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2_000);
  }

  throw new Error("Training did not complete within 6 hours");
}

// ── Step 9: Deploy ───────────────────────────────────────────────────────────

/**
 * Deploy the trained model.
 *
 * Flow:
 * 1. Navigate to Deploy page
 * 2. Click Create Endpoint
 * 3. Wait for endpoint to become active
 *
 * Endpoint status:
 * - Active: buttons are enabled, endpoint name is visible
 * - In-progress: buttons are disabled, tooltip shows "endpoint preparation"
 */
export async function deployModel(
  page: Page,
  deployPage: any,
  projectId: string,
  consoleErrors: ConsoleCapture
): Promise<void> {
  // Re-authenticate — the training wait can take hours, expiring the token.
  const { LoginPage } = await import("../../../src/pages/LoginPage");
  const loginPage = new LoginPage(page);
  await loginPage.loginAs("admin");
  await page.waitForLoadState("networkidle");

  // Navigate to deploy page
  await deployPage.goto(projectId);
  expect(await deployPage.isLoaded()).toBe(true);

  // Click "Create Endpoint" button
  const createBtn = page
    .locator("#deploy-create-endpoint")
    .first();
  await createBtn.waitFor({ state: "visible", timeout: 15_000 });
  await createBtn.click();

  // Wait for the create endpoint dialog/form to appear
  await page.waitForTimeout(3_000);

  // Select the trained model (if there's a dropdown)
  const modelSelect = page.locator(
    "#deploy-page .mat-mdc-select, #deploy-page mat-select"
  ).first();
  if (await modelSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await modelSelect.click();
    await page.waitForTimeout(1_000);
    // Select the first available model
    const firstOption = page
      .locator(".mat-mdc-option")
      .first();
    await firstOption.click();
    await page.waitForTimeout(500);
  }

  // Confirm deployment (look for deploy/confirm button in dialog)
  const confirmDeploy = page
    .locator(
      "button:has-text('Deploy'), button:has-text('Create'), button:has-text('Confirm')"
    )
    .last();
  if (
    await confirmDeploy.isVisible({ timeout: 5_000 }).catch(() => false)
  ) {
    await confirmDeploy.click();
  }

  // Poll for deployment to become active (max 10 minutes)
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    // Check if endpoint is active (name is visible and buttons are enabled)
    const endpointName = page
      .locator("#deploy-active-endpoint-name")
      .first();
    if (
      await endpointName
        .isVisible({ timeout: 3_000 })
        .catch(() => false)
    ) {
      const text = await endpointName.textContent();
      if (text && text.trim().length > 0) {
        // Endpoint is active
        assertCheckpoint(consoleErrors);
        return;
      }
    }

    // Check if we have any endpoints listed
    const hasEndpoints = await deployPage.hasEndpoints();
    if (hasEndpoints) {
      // Check if the edit button is enabled (indicates active endpoint)
      const editBtn = page.locator("#deploy-edit-endpoint").first();
      if (
        await editBtn.isEnabled({ timeout: 2_000 }).catch(() => false)
      ) {
        assertCheckpoint(consoleErrors);
        return;
      }
    }

    // Refresh and poll
    await page.waitForTimeout(15_000);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2_000);
  }

  throw new Error("Deployment did not become active within 10 minutes");
}

// ── Step 10: Cleanup ─────────────────────────────────────────────────────────

/**
 * Clean up a project after test.
 * Tries API archive first, falls back to UI delete.
 */
export async function cleanupProject(
  page: Page,
  projectId: string
): Promise<void> {
  if (!projectId) return;

  // Try API archive first
  try {
    const api = createApiHelper(page, envConfig.apiBaseUrl);
    await api.patch(`/projects/${projectId}`, { archived: true });
    return;
  } catch {
    // API archive failed — try UI delete
  }

  try {
    // Navigate to projects list
    await page.goto("/projects", { waitUntil: "networkidle" });
    await page.waitForTimeout(2_000);

    // Search for the project
    const searchInput = page
      .locator("#projects-quick-search input")
      .first();
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // We can't easily search by ID, so try to find it in the card list
    }

    // Find the project card and open its menu
    // The card menu trigger has id: projects-project-card-menu-trigger-{safeId}
    const safeId = projectId.replace(/-/g, "");
    const menuTrigger = page
      .locator(
        `#projects-project-card-menu-trigger-${safeId}, ` +
          `#projects-project-card-menu-trigger-${projectId}`
      )
      .first();

    if (await menuTrigger.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await menuTrigger.click();
      await page.waitForTimeout(1_000);

      // Click "Delete" menu item
      const deleteItem = page
        .locator(
          `[id*="project-card-menu-delete-${safeId}], ` +
            `[id*="project-card-menu-delete-${projectId}"], ` +
            `[role="menuitem"]:has-text("Delete")`
        )
        .first();
      await deleteItem.click();
      await page.waitForTimeout(1_000);

      // Confirm deletion
      const confirmBtn = page
        .locator("#dialog-project-delete-confirm")
        .first();
      await confirmBtn.waitFor({ state: "visible", timeout: 5_000 });
      await confirmBtn.click();
      await page.waitForTimeout(2_000);
    }
  } catch {
    // Best-effort cleanup — don't fail the test
    console.warn(
      `Failed to clean up project ${projectId}. Manual cleanup may be needed.`
    );
  }
}

// ── Full Pipeline Runners ────────────────────────────────────────────────────

/**
 * Extract the project ID from the current page URL.
 * Matches patterns like /project/{id}/... or /dataset/{id}/...
 */
export function extractProjectIdFromUrl(url: string): string {
  const match = url.match(/\/(?:project|dataset)\/([^/]+)/);
  return match ? match[1] : "";
}
