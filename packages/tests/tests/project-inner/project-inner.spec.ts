import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// Helper: navigate to projects and get the first project ID
async function getFirstProjectId(page: any, projectsPage: any): Promise<string | null> {
  await projectsPage.goto();
  const hasCards = await projectsPage.hasProjectCards();
  if (!hasCards) return null;
  await projectsPage.clickOpenProject(0);
  await page.waitForURL(/\/project\/[a-f0-9-]+/, { timeout: 15000 }).catch(() => {});
  const url = page.url();
  const match = url.match(/\/project\/([a-f0-9-]+)/);
  return match ? match[1] : null;
}

// ─── Block 1: Project Overview ────────────────────────────────────────────────
test.describe("Project Overview - Layout @project-overview @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | null;

  test.beforeEach(async ({ loginPage, projectsPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    projectId = await getFirstProjectId(page, projectsPage);
    test.skip(!projectId, "No projects available");
  });

  test("should load the project overview page", async ({ projectOverviewPage, consoleErrors }) => {
    await projectOverviewPage.goto(projectId!);
    const loaded = await projectOverviewPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the project name", async ({ projectOverviewPage, consoleErrors }) => {
    await projectOverviewPage.goto(projectId!);
    const visible = await projectOverviewPage.isProjectNameVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display edit name button", async ({ projectOverviewPage, consoleErrors }) => {
    await projectOverviewPage.goto(projectId!);
    const visible = await projectOverviewPage.isEditNameButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display copy project ID button", async ({ projectOverviewPage, consoleErrors }) => {
    await projectOverviewPage.goto(projectId!);
    const visible = await projectOverviewPage.isCopyIdButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display change sharing button", async ({ projectOverviewPage, consoleErrors }) => {
    await projectOverviewPage.goto(projectId!);
    const visible = await projectOverviewPage.isChangeSharingButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("no console errors after overview load", async ({ projectOverviewPage, consoleErrors }) => {
    await projectOverviewPage.goto(projectId!);
    await projectOverviewPage.isLoaded();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Dataset/Images ──────────────────────────────────────────────────
test.describe("Project Dataset - Layout @project-dataset @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | null;

  test.beforeEach(async ({ loginPage, projectsPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    projectId = await getFirstProjectId(page, projectsPage);
    test.skip(!projectId, "No projects available");
  });

  test("should load the dataset images page", async ({ projectDatasetPage, consoleErrors }) => {
    await projectDatasetPage.goto(projectId!);
    const loaded = await projectDatasetPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display upload button", async ({ projectDatasetPage, consoleErrors }) => {
    await projectDatasetPage.goto(projectId!);
    const visible = await projectDatasetPage.isUploadButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("no console errors after dataset load", async ({ projectDatasetPage, consoleErrors }) => {
    await projectDatasetPage.goto(projectId!);
    await projectDatasetPage.isLoaded();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Manage Labels ───────────────────────────────────────────────────
test.describe("Manage Labels - Layout @manage-labels @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | null;

  test.beforeEach(async ({ loginPage, projectsPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    projectId = await getFirstProjectId(page, projectsPage);
    test.skip(!projectId, "No projects available");
  });

  test("should load the manage labels page", async ({ manageLabelsPage, consoleErrors }) => {
    await manageLabelsPage.goto(projectId!);
    const loaded = await manageLabelsPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display add label button", async ({ manageLabelsPage, consoleErrors }) => {
    await manageLabelsPage.goto(projectId!);
    const visible = await manageLabelsPage.isAddLabelButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display table or empty state", async ({ manageLabelsPage, consoleErrors }) => {
    await manageLabelsPage.goto(projectId!);
    await manageLabelsPage.isLoaded();
    const tableVisible = await manageLabelsPage.isTableVisible();
    const emptyVisible = await manageLabelsPage.isEmptyStateVisible();
    expect(tableVisible || emptyVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("no console errors after manage labels load", async ({ manageLabelsPage, consoleErrors }) => {
    await manageLabelsPage.goto(projectId!);
    await manageLabelsPage.isLoaded();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Manage Tags ─────────────────────────────────────────────────────
test.describe("Manage Tags - Layout @manage-tags @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | null;

  test.beforeEach(async ({ loginPage, projectsPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    projectId = await getFirstProjectId(page, projectsPage);
    test.skip(!projectId, "No projects available");
  });

  test("should load the manage tags page", async ({ manageTagsPage, consoleErrors }) => {
    await manageTagsPage.goto(projectId!);
    const loaded = await manageTagsPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display add tag button", async ({ manageTagsPage, consoleErrors }) => {
    await manageTagsPage.goto(projectId!);
    const visible = await manageTagsPage.isAddTagButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display table or empty state", async ({ manageTagsPage, consoleErrors }) => {
    await manageTagsPage.goto(projectId!);
    await manageTagsPage.isLoaded();
    const tableVisible = await manageTagsPage.isTableVisible();
    const emptyVisible = await manageTagsPage.isEmptyStateVisible();
    expect(tableVisible || emptyVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("no console errors after manage tags load", async ({ manageTagsPage, consoleErrors }) => {
    await manageTagsPage.goto(projectId!);
    await manageTagsPage.isLoaded();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 5: Train ───────────────────────────────────────────────────────────
test.describe("Train - Layout @train @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | null;

  test.beforeEach(async ({ loginPage, projectsPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    projectId = await getFirstProjectId(page, projectsPage);
    test.skip(!projectId, "No projects available");
  });

  test("should load the train page", async ({ trainPage, consoleErrors }) => {
    await trainPage.goto(projectId!);
    const loaded = await trainPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display fast training button", async ({ trainPage, consoleErrors }) => {
    await trainPage.goto(projectId!);
    const visible = await trainPage.isFastTrainingButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display advanced training button", async ({ trainPage, consoleErrors }) => {
    await trainPage.goto(projectId!);
    const visible = await trainPage.isAdvancedTrainingButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("no console errors after train page load", async ({ trainPage, consoleErrors }) => {
    await trainPage.goto(projectId!);
    await trainPage.isLoaded();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 6: Deploy ──────────────────────────────────────────────────────────
test.describe("Deploy - Layout @deploy @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | null;

  test.beforeEach(async ({ loginPage, projectsPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    projectId = await getFirstProjectId(page, projectsPage);
    test.skip(!projectId, "No projects available");
  });

  test("should load the deploy page", async ({ deployPage, consoleErrors }) => {
    await deployPage.goto(projectId!);
    const loaded = await deployPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display endpoints or empty state", async ({ deployPage, consoleErrors }) => {
    await deployPage.goto(projectId!);
    await deployPage.isLoaded();
    const hasEndpoints = await deployPage.hasEndpoints();
    const emptyVisible = await deployPage.isEmptyStateVisible();
    expect(hasEndpoints || emptyVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("no console errors after deploy page load", async ({ deployPage, consoleErrors }) => {
    await deployPage.goto(projectId!);
    await deployPage.isLoaded();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 7: Dataset Overview ────────────────────────────────────────────────
test.describe("Dataset Overview - Layout @dataset-overview @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | null;

  test.beforeEach(async ({ loginPage, projectsPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    projectId = await getFirstProjectId(page, projectsPage);
    test.skip(!projectId, "No projects available");
  });

  test("should load the dataset overview page", async ({ datasetOverviewPage, consoleErrors }) => {
    await datasetOverviewPage.goto(projectId!);
    const loaded = await datasetOverviewPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display content or empty state", async ({ datasetOverviewPage, consoleErrors }) => {
    await datasetOverviewPage.goto(projectId!);
    await datasetOverviewPage.isLoaded();
    const hasData = await datasetOverviewPage.hasData();
    const isEmpty = await datasetOverviewPage.isEmptyStateVisible();
    expect(hasData || isEmpty).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should show refresh button when data exists", async ({ datasetOverviewPage, consoleErrors }) => {
    await datasetOverviewPage.goto(projectId!);
    await datasetOverviewPage.isLoaded();
    const hasData = await datasetOverviewPage.hasData();
    test.skip(!hasData, "No dataset uploaded — empty state");
    const visible = await datasetOverviewPage.isRefreshButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should show upload button when empty", async ({ datasetOverviewPage, consoleErrors }) => {
    await datasetOverviewPage.goto(projectId!);
    await datasetOverviewPage.isLoaded();
    const isEmpty = await datasetOverviewPage.isEmptyStateVisible();
    test.skip(!isEmpty, "Dataset has data — not testing empty state");
    const visible = await datasetOverviewPage.isUploadButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("no console errors after dataset overview load", async ({ datasetOverviewPage, consoleErrors }) => {
    await datasetOverviewPage.goto(projectId!);
    await datasetOverviewPage.isLoaded();
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 8: Labeling Tasks ──────────────────────────────────────────────────
test.describe("Labeling Tasks - Layout @labeling-tasks @smoke", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  let projectId: string | null;

  test.beforeEach(async ({ loginPage, projectsPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    projectId = await getFirstProjectId(page, projectsPage);
    test.skip(!projectId, "No projects available");
  });

  test("should load the labeling tasks page", async ({ labelingTasksListPage, consoleErrors }) => {
    await labelingTasksListPage.goto(projectId!);
    const loaded = await labelingTasksListPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the heading", async ({ labelingTasksListPage, consoleErrors }) => {
    await labelingTasksListPage.goto(projectId!);
    const visible = await labelingTasksListPage.isHeadingVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the search input", async ({ labelingTasksListPage, consoleErrors }) => {
    await labelingTasksListPage.goto(projectId!);
    const visible = await labelingTasksListPage.isSearchVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the table", async ({ labelingTasksListPage, consoleErrors }) => {
    await labelingTasksListPage.goto(projectId!);
    const visible = await labelingTasksListPage.isTableVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should be able to search", async ({ labelingTasksListPage, consoleErrors }) => {
    await labelingTasksListPage.goto(projectId!);
    await labelingTasksListPage.searchTasks("test");
    consoleErrors.assertNoErrors();
  });

  test("no console errors after labeling tasks load", async ({ labelingTasksListPage, consoleErrors }) => {
    await labelingTasksListPage.goto(projectId!);
    await labelingTasksListPage.isLoaded();
    consoleErrors.assertNoErrors();
  });
});
