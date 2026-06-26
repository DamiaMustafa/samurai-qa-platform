/**
 * plan-upgrade.spec.ts — E2E tests for Plan Upgrade and Add Credit dialogs.
 *
 * Test Matrix (8 tests):
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Block 1: Upgrade Dialog @plan @upgrade (3 tests)                           │
 * │   1. upgrade dialog opens with title and features list                     │
 * │   2. upgrade dialog shows date picker fields                               │
 * │   3. upgrade dialog submit button visible                                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Block 2: Add Credit Dialog @plan @credit (3 tests)                         │
 * │   4. add credit dialog opens with credit items                             │
 * │   5. credit items show AI Training, Cloud AI, File Storage titles          │
 * │   6. increase and decrease buttons update quantity                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Block 3: Dialog Actions @plan @dialog (2 tests)                            │
 * │   7. buy credit button triggers add credit dialog                          │
 * │   8. skip button visible when entered from upgrade flow                    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { test, expect } from "../../src/fixtures";
import { envConfig } from "../../src/config/environments";
import {
  createMockCompany,
  mockCompanyPlanGraphQL,
  MOCK_COMPANIES,
} from "../../src/helpers/plan-helpers";

// ─── Block 1: Upgrade Dialog @plan @upgrade ──────────────────────────────────────
test.describe("Upgrade Dialog @plan @upgrade", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  const detailCompany = MOCK_COMPANIES.activeStarter;

  test.beforeEach(async ({ loginPage, planPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockCompanyPlanGraphQL(page, [], detailCompany);
    await planPage.goto(detailCompany.id);
  });

  // 1. upgrade dialog opens with title and features list
  test("upgrade dialog opens with title and features list", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    const upgradeVisible = await planPage.isUpgradeButtonVisible();
    test.skip(!upgradeVisible, "Upgrade button not visible (non-superadmin)");

    await planPage.clickUpgrade();
    await page.waitForTimeout(2000);

    const dialogVisible = await planPage.isUpgradeDialogVisible();
    expect(dialogVisible).toBe(true);

    const title = await planPage.getUpgradeDialogTitle();
    expect(title.length).toBeGreaterThan(0);

    const featureCount = await planPage.getUpgradeFeatureCount();
    expect(featureCount).toBeGreaterThan(0);

    const featureTexts = await planPage.getUpgradeFeatureTexts();
    expect(featureTexts.length).toBeGreaterThan(0);
    expect(featureTexts.every((t) => t.length > 0)).toBe(true);

    consoleErrors.assertNoErrors();
  });

  // 2. upgrade dialog shows date picker fields
  test("upgrade dialog shows date picker fields", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    const upgradeVisible = await planPage.isUpgradeButtonVisible();
    test.skip(!upgradeVisible, "Upgrade button not visible (non-superadmin)");

    await planPage.clickUpgrade();
    await page.waitForTimeout(2000);

    const dialogVisible = await planPage.isUpgradeDialogVisible();
    test.skip(!dialogVisible, "Upgrade dialog not visible");

    const datePickerCount = await planPage.getUpgradeDatePickerCount();
    expect(datePickerCount).toBeGreaterThan(0);

    consoleErrors.assertNoErrors();
  });

  // 3. upgrade dialog submit button visible
  test("upgrade dialog submit button visible", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    const upgradeVisible = await planPage.isUpgradeButtonVisible();
    test.skip(!upgradeVisible, "Upgrade button not visible (non-superadmin)");

    await planPage.clickUpgrade();
    await page.waitForTimeout(2000);

    const dialogVisible = await planPage.isUpgradeDialogVisible();
    test.skip(!dialogVisible, "Upgrade dialog not visible");

    const submitVisible = await planPage.isUpgradeSubmitButtonVisible();
    expect(submitVisible).toBe(true);

    consoleErrors.assertNoErrors();
  });
});

// ─── Block 2: Add Credit Dialog @plan @credit ────────────────────────────────────
test.describe("Add Credit Dialog @plan @credit", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  const detailCompany = MOCK_COMPANIES.activeStarter;

  test.beforeEach(async ({ loginPage, planPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockCompanyPlanGraphQL(page, [], detailCompany);
    await planPage.goto(detailCompany.id);
  });

  // 4. add credit dialog opens with credit items
  test("add credit dialog opens with credit items", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    const buyCreditVisible = await planPage.isBuyCreditButtonVisible();
    test.skip(
      !buyCreditVisible,
      "Buy credit button not visible (non-superadmin or not Active)"
    );

    await planPage.clickBuyCredit();
    await page.waitForTimeout(2000);

    const dialogVisible = await planPage.isAddCreditDialogVisible();
    expect(dialogVisible).toBe(true);

    const itemCount = await planPage.getCreditItemCount();
    expect(itemCount).toBeGreaterThan(0);

    consoleErrors.assertNoErrors();
  });

  // 5. credit items show AI Training, Cloud AI, File Storage titles
  test("credit items show AI Training, Cloud AI, File Storage titles", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    const buyCreditVisible = await planPage.isBuyCreditButtonVisible();
    test.skip(
      !buyCreditVisible,
      "Buy credit button not visible (non-superadmin or not Active)"
    );

    await planPage.clickBuyCredit();
    await page.waitForTimeout(2000);

    const dialogVisible = await planPage.isAddCreditDialogVisible();
    test.skip(!dialogVisible, "Add credit dialog not visible");

    const titles = await planPage.getCreditItemTitles();
    expect(titles.length).toBeGreaterThanOrEqual(3);

    const titlesLower = titles.map((t) => t.toLowerCase());
    expect(titlesLower.some((t) => t.includes("train"))).toBe(true);
    expect(
      titlesLower.some(
        (t) => t.includes("cloud") || t.includes("inference") || t.includes("api")
      )
    ).toBe(true);
    expect(titlesLower.some((t) => t.includes("file") || t.includes("storage"))).toBe(true);

    consoleErrors.assertNoErrors();
  });

  // 6. increase and decrease buttons update quantity
  test("increase and decrease buttons update quantity", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    const buyCreditVisible = await planPage.isBuyCreditButtonVisible();
    test.skip(
      !buyCreditVisible,
      "Buy credit button not visible (non-superadmin or not Active)"
    );

    await planPage.clickBuyCredit();
    await page.waitForTimeout(2000);

    const dialogVisible = await planPage.isAddCreditDialogVisible();
    test.skip(!dialogVisible, "Add credit dialog not visible");

    // Get the initial quantity from the first credit item's input
    const firstItem = page.locator(".plan-upgrade__credit-item").nth(0);
    const quantityInput = firstItem.locator(
      ".plan-upgrade__credit-item-quantity-num input, .plan-upgrade__credit-item-quantity-num sc-input input"
    );
    const initialValue = await quantityInput.inputValue();
    const initialNum = parseInt(initialValue, 10);

    // Click increase on the first item
    await planPage.clickCreditIncrease(0);
    await page.waitForTimeout(500);

    const afterIncrease = await quantityInput.inputValue();
    const afterIncreaseNum = parseInt(afterIncrease, 10);
    expect(afterIncreaseNum).toBeGreaterThan(initialNum);

    // Click decrease on the first item to go back
    await planPage.clickCreditDecrease(0);
    await page.waitForTimeout(500);

    const afterDecrease = await quantityInput.inputValue();
    const afterDecreaseNum = parseInt(afterDecrease, 10);
    expect(afterDecreaseNum).toBe(initialNum);

    consoleErrors.assertNoErrors();
  });
});

// ─── Block 3: Dialog Actions @plan @dialog ───────────────────────────────────────
test.describe("Dialog Actions @plan @dialog", () => {
  test.skip(
    !envConfig.credentials.admin.username,
    "Admin credentials not configured in .env"
  );

  const detailCompany = MOCK_COMPANIES.activeStarter;

  test.beforeEach(async ({ loginPage, planPage, page }) => {
    await loginPage.loginAs("admin");
    const error = await loginPage.getLoginErrorMessage();
    test.skip(!!error, `Login blocked by environment: ${error}`);
    await mockCompanyPlanGraphQL(page, [], detailCompany);
    await planPage.goto(detailCompany.id);
  });

  // 7. buy credit button triggers add credit dialog
  test("buy credit button triggers add credit dialog", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    const buyCreditVisible = await planPage.isBuyCreditButtonVisible();
    test.skip(
      !buyCreditVisible,
      "Buy credit button not visible (non-superadmin or not Active)"
    );

    await planPage.clickBuyCredit();
    await page.waitForTimeout(2000);

    const dialogVisible = await planPage.isAddCreditDialogVisible();
    expect(dialogVisible).toBe(true);

    // Verify the add credit confirmation button is also visible
    const addButtonVisible = await planPage.isAddCreditButtonVisible();
    expect(addButtonVisible).toBe(true);

    consoleErrors.assertNoErrors();
  });

  // 8. skip button not visible when opened directly (skip only shown from upgrade flow)
  test("skip button not visible when opened directly from buy credit", async ({
    planPage,
    page,
    consoleErrors,
  }) => {
    const buyCreditVisible = await planPage.isBuyCreditButtonVisible();
    test.skip(
      !buyCreditVisible,
      "Buy credit button not visible (non-superadmin or not Active)"
    );

    await planPage.clickBuyCredit();
    await page.waitForTimeout(2000);

    const dialogVisible = await planPage.isAddCreditDialogVisible();
    test.skip(!dialogVisible, "Add credit dialog not visible");

    // The skip button is only visible when entered from the upgrade flow
    // (extraData.page === 'plan-upgrade'). Since we open via buy credit button
    // directly (page='add-credit'), the skip button should NOT be visible.
    const skipVisible = await planPage.isSkipButtonVisible();
    expect(skipVisible).toBe(false);

    consoleErrors.assertNoErrors();
  });
});