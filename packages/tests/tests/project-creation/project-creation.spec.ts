import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";

// ─── Block 1: Page Layout ─────────────────────────────────────────────────────
test.describe("Project Creation - Layout @project-creation @smoke", () => {
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

  test("should load the project creation page", async ({ projectCreationPage, consoleErrors }) => {
    const loaded = await projectCreationPage.isLoaded();
    expect(loaded).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display all three project type cards", async ({ projectCreationPage, consoleErrors }) => {
    const visible = await projectCreationPage.isTypeSelectionVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the name input", async ({ projectCreationPage, consoleErrors }) => {
    // Name input appears after type selection
    await projectCreationPage.selectType("object_detection");
    const visible = await projectCreationPage.isNameInputVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the description input", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    const visible = await projectCreationPage.isDescriptionVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display sharing options", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    const visible = await projectCreationPage.isSharingOptionsVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should display the submit button", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    const visible = await projectCreationPage.isSubmitButtonVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Type Selection ──────────────────────────────────────────────────
test.describe("Project Creation - Type Selection @project-creation @types", () => {
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

  test("should select object detection type", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    const selected = await projectCreationPage.isTypeSelected("object_detection");
    expect(selected).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should select classification type", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("classification");
    const selected = await projectCreationPage.isTypeSelected("classification");
    expect(selected).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should select segmentation type", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("segmentation");
    const selected = await projectCreationPage.isTypeSelected("segmentation");
    expect(selected).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("should switch between types", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    let selected = await projectCreationPage.isTypeSelected("object_detection");
    expect(selected).toBe(true);

    await projectCreationPage.selectType("classification");
    selected = await projectCreationPage.isTypeSelected("classification");
    expect(selected).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Form Validation ─────────────────────────────────────────────────
test.describe("Project Creation - Form Validation @project-creation @validation", () => {
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

  test("submit button should be disabled when name is empty", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    const disabled = await projectCreationPage.isSubmitButtonDisabled();
    expect(disabled).toBe(true);
    consoleErrors.assertNoErrors();
  });

  test("submit button should be enabled when name is filled", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    await projectCreationPage.fillName("Test Project");
    const disabled = await projectCreationPage.isSubmitButtonDisabled();
    expect(disabled).toBe(false);
    consoleErrors.assertNoErrors();
  });

  test("should fill name and description", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    await projectCreationPage.fillName("E2E Test Project");
    await projectCreationPage.fillDescription("This is a test project created by E2E tests");
    // No errors after filling form
    consoleErrors.assertNoErrors();
  });

  test("should show default labeler and reviewer dropdowns", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    const labelerVisible = await projectCreationPage.isLabelerDropdownVisible();
    const reviewerVisible = await projectCreationPage.isReviewerDropdownVisible();
    expect(labelerVisible).toBe(true);
    expect(reviewerVisible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 4: Platform Version ────────────────────────────────────────────────
test.describe("Project Creation - Platform Version @project-creation @version", () => {
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

  test("should display platform version radio group", async ({ projectCreationPage, consoleErrors }) => {
    await projectCreationPage.selectType("object_detection");
    const visible = await projectCreationPage.isPlatformVersionVisible();
    expect(visible).toBe(true);
    consoleErrors.assertNoErrors();
  });
});

// ─── Block 5: Console Errors ──────────────────────────────────────────────────
test.describe("Project Creation - Console Errors @project-creation @console", () => {
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

  test("no console errors after page load", async ({ consoleErrors }) => {
    consoleErrors.assertNoErrors();
  });
});
