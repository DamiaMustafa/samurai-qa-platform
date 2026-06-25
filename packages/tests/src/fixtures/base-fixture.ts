import { test as base } from "@playwright/test";
import { LoginPage, DashboardPage, NavigationPage, HomePage, ProjectsPage, ApiKeysPage, InstantDistillPage, EdgeManagementPage, WorkflowListingPage, UserManagementPage, PlanPage, ProjectCreationPage, SignUpPage, ForgotPasswordPage, ChangePasswordPage, ProjectOverviewPage, ProjectDatasetPage, ManageLabelsPage, ManageTagsPage, TrainPage, DeployPage, DatasetOverviewPage, LabelingTasksListPage, UploadDatasetPage, LabelingModeSelectionPage, LabelingTaskCreationPage, FastTrainingFormPage } from "../pages";
import { takeResultScreenshot } from "./screenshot-helper";
import { listenForConsoleErrors } from "../helpers/console-error-helper";

/**
 * Custom fixtures that inject Page Objects into every test.
 * Usage: `test('my test', async ({ loginPage, dashboardPage }) => { ... })`
 */
export type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  navigationPage: NavigationPage;
  homePage: HomePage;
  projectsPage: ProjectsPage;
  apiKeysPage: ApiKeysPage;
  instantDistillPage: InstantDistillPage;
  edgeManagementPage: EdgeManagementPage;
  workflowListingPage: WorkflowListingPage;
  userManagementPage: UserManagementPage;
  planPage: PlanPage;
  projectCreationPage: ProjectCreationPage;
  signUpPage: SignUpPage;
  forgotPasswordPage: ForgotPasswordPage;
  changePasswordPage: ChangePasswordPage;
  projectOverviewPage: ProjectOverviewPage;
  projectDatasetPage: ProjectDatasetPage;
  manageLabelsPage: ManageLabelsPage;
  manageTagsPage: ManageTagsPage;
  trainPage: TrainPage;
  deployPage: DeployPage;
  datasetOverviewPage: DatasetOverviewPage;
  labelingTasksListPage: LabelingTasksListPage;
  uploadDatasetPage: UploadDatasetPage;
  labelingModeSelectionPage: LabelingModeSelectionPage;
  labelingTaskCreationPage: LabelingTaskCreationPage;
  fastTrainingFormPage: FastTrainingFormPage;
  consoleErrors: ReturnType<typeof listenForConsoleErrors>;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  navigationPage: async ({ page }, use) => {
    await use(new NavigationPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },

  apiKeysPage: async ({ page }, use) => {
    await use(new ApiKeysPage(page));
  },

  instantDistillPage: async ({ page }, use) => {
    await use(new InstantDistillPage(page));
  },

  edgeManagementPage: async ({ page }, use) => {
    await use(new EdgeManagementPage(page));
  },

  workflowListingPage: async ({ page }, use) => {
    await use(new WorkflowListingPage(page));
  },

  userManagementPage: async ({ page }, use) => {
    await use(new UserManagementPage(page));
  },

  planPage: async ({ page }, use) => {
    await use(new PlanPage(page));
  },

  projectCreationPage: async ({ page }, use) => {
    await use(new ProjectCreationPage(page));
  },

  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page));
  },

  forgotPasswordPage: async ({ page }, use) => {
    await use(new ForgotPasswordPage(page));
  },

  changePasswordPage: async ({ page }, use) => {
    await use(new ChangePasswordPage(page));
  },

  projectOverviewPage: async ({ page }, use) => {
    await use(new ProjectOverviewPage(page));
  },

  projectDatasetPage: async ({ page }, use) => {
    await use(new ProjectDatasetPage(page));
  },

  manageLabelsPage: async ({ page }, use) => {
    await use(new ManageLabelsPage(page));
  },

  manageTagsPage: async ({ page }, use) => {
    await use(new ManageTagsPage(page));
  },

  trainPage: async ({ page }, use) => {
    await use(new TrainPage(page));
  },

  deployPage: async ({ page }, use) => {
    await use(new DeployPage(page));
  },

  datasetOverviewPage: async ({ page }, use) => {
    await use(new DatasetOverviewPage(page));
  },

  labelingTasksListPage: async ({ page }, use) => {
    await use(new LabelingTasksListPage(page));
  },

  uploadDatasetPage: async ({ page }, use) => {
    await use(new UploadDatasetPage(page));
  },

  labelingModeSelectionPage: async ({ page }, use) => {
    await use(new LabelingModeSelectionPage(page));
  },

  labelingTaskCreationPage: async ({ page }, use) => {
    await use(new LabelingTaskCreationPage(page));
  },

  fastTrainingFormPage: async ({ page }, use) => {
    await use(new FastTrainingFormPage(page));
  },

  consoleErrors: async ({ page }, use) => {
    const capture = listenForConsoleErrors(page);
    await use(capture);
  },

  // Auto-fixture: takes a screenshot after every test with readable naming
  page: async ({ page }, use, testInfo) => {
    await use(page);
    await takeResultScreenshot(page, testInfo);
  },
});

export { expect } from "@playwright/test";
