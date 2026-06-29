import { type Page } from "@playwright/test";

/**
 * Plan page test helpers — mock data & GraphQL route mocking
 * for company plan tracking, plan details, and upgrade/credit dialogs.
 *
 * Mirrors the pattern from instant-distill-helpers.ts.
 */

// ── Mock Data ────────────────────────────────────────────────────────────────

export interface MockCompanyPlan {
  id: string;
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  storageUsedGB: number;
  trainingMinutesUsed: number;
  inferenceAPICallsUsed: number;
  additionalTrainingMinutes: number;
  additionalInferenceAPICalls: number;
  additionalStorageUsedGB: number;
  additionalTrainingMinutesUsed?: number;
  additionalInferenceAPICallsUsed?: number;
  additionalStorageUsed?: number;
  projectsCount: number;
  usersCount: number;
}

/**
 * Create a mock company with plan data.
 * Defaults to a Starter / Active company with light usage.
 */
export function createMockCompany(
  overrides: Partial<MockCompanyPlan> = {}
): MockCompanyPlan {
  return {
    id: "mock-company-001",
    name: "Acme Corp",
    subscriptionPlan: "Starter",
    subscriptionStatus: "Active",
    subscriptionStartDate: "2025-01-01T00:00:00.000Z",
    subscriptionEndDate: "2026-01-01T00:00:00.000Z",
    storageUsedGB: 5.2,
    trainingMinutesUsed: 120,
    inferenceAPICallsUsed: 350,
    additionalTrainingMinutes: 0,
    additionalInferenceAPICalls: 0,
    additionalStorageUsedGB: 0,
    projectsCount: 3,
    usersCount: 2,
    ...overrides,
  };
}

/**
 * Pre-built mock companies for common test scenarios.
 */
export const MOCK_COMPANIES = {
  activeStarter: createMockCompany(),

  activeProfessional: createMockCompany({
    id: "mock-company-pro",
    name: "Pro Corp",
    subscriptionPlan: "Professional",
    storageUsedGB: 45.5,
    trainingMinutesUsed: 1200,
    inferenceAPICallsUsed: 5000,
    projectsCount: 12,
    usersCount: 8,
  }),

  expiredStarter: createMockCompany({
    id: "mock-company-expired",
    name: "Expired Corp",
    subscriptionStatus: "Expired",
    subscriptionEndDate: "2024-06-01T00:00:00.000Z",
  }),

  freeNoPlan: createMockCompany({
    id: "mock-company-free",
    name: "Free Corp",
    subscriptionPlan: "Free",
    subscriptionStatus: "",
  }),

  withAdditionalCredit: createMockCompany({
    id: "mock-company-credit",
    name: "Credit Corp",
    additionalTrainingMinutes: 1000,
    additionalInferenceAPICalls: 10000,
    additionalStorageUsedGB: 100,
    additionalTrainingMinutesUsed: 200,
    additionalInferenceAPICallsUsed: 3000,
    additionalStorageUsed: 25,
  }),
};

// ── Company List (for Plan Tracking page) ────────────────────────────────────

export function createMockCompanyList(): MockCompanyPlan[] {
  return [
    MOCK_COMPANIES.activeStarter,
    MOCK_COMPANIES.activeProfessional,
    MOCK_COMPANIES.expiredStarter,
    createMockCompany({
      id: "mock-company-004",
      name: "Delta Inc",
      subscriptionPlan: "Starter",
      subscriptionStatus: "Active",
    }),
    createMockCompany({
      id: "mock-company-005",
      name: "Echo Labs",
      subscriptionPlan: "Professional",
      subscriptionStatus: "Active",
    }),
    MOCK_COMPANIES.freeNoPlan,
  ];
}

// ── GraphQL Mock Responses ───────────────────────────────────────────────────

function companyHandlerListResponse(companies: MockCompanyPlan[]) {
  return {
    data: {
      companyHandler: {
        items: companies.map((c) => ({
          ...c,
          __typename: "Company",
        })),
        nextToken: null,
        __typename: "CompanyHandlerResponse",
      },
    },
  };
}

function companyHandlerReadResponse(company: MockCompanyPlan) {
  return {
    data: {
      companyHandler: {
        items: [{ ...company, __typename: "Company" }],
        __typename: "CompanyHandlerResponse",
      },
    },
  };
}

function companyHandlerUpdateResponse(company: MockCompanyPlan, updatedData: any) {
  const merged = { ...company, ...updatedData };
  return {
    data: {
      companyHandler: {
        items: [{ ...merged, __typename: "Company" }],
        __typename: "CompanyHandlerResponse",
      },
    },
  };
}

// ── Route Mocking ────────────────────────────────────────────────────────────

/**
 * Set up comprehensive GraphQL mocking for company/plan operations.
 * Intercepts the companyHandler mutation and returns mock responses
 * based on the operation field in the JSON input.
 *
 * @param page — Playwright page instance
 * @param companies — list of mock companies for QUERY/SEARCH
 * @param detailCompany — the company returned for READ (plan details)
 */
export async function mockCompanyPlanGraphQL(
  page: Page,
  companies: MockCompanyPlan[],
  detailCompany: MockCompanyPlan
): Promise<void> {
  await page.route("**/graphql", async (route) => {
    const postData = route.request().postData() || "";

    if (!postData.includes("companyHandler")) {
      await route.continue();
      return;
    }

    // Extract the JSON input to determine the operation.
    // AWS Amplify may send input as either a string or an object in variables.
    let input: any = {};
    let parsed = false;
    try {
      const body = JSON.parse(postData);
      const inputRaw = body?.variables?.input ?? body?.input;
      if (inputRaw) {
        input = typeof inputRaw === "string" ? JSON.parse(inputRaw) : inputRaw;
        parsed = true;
      }
    } catch {
      // Fall through to raw-text matching below
    }

    const operation = input?.operation;

    if (parsed && operation === "QUERY") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(companyHandlerListResponse(companies)),
      });
      return;
    }

    if (parsed && operation === "SEARCH") {
      const searchInput = (input?.searchInput || "").toLowerCase();
      const filtered = companies.filter((c) =>
        c.name.toLowerCase().includes(searchInput)
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(companyHandlerListResponse(filtered)),
      });
      return;
    }

    if (parsed && operation === "READ") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(companyHandlerReadResponse(detailCompany)),
      });
      return;
    }

    if (parsed && operation === "UPDATE") {
      const updatedData = input?.updatedData || {};
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          companyHandlerUpdateResponse(detailCompany, updatedData)
        ),
      });
      return;
    }

    // Fallback: raw text matching when JSON parsing fails or operation is unknown.
    // The plan details page sends a READ operation to fetch company data.
    // If we can't determine the operation, default to READ (plan details)
    // since that's the most common call during page initialization.
    if (
      postData.includes('"operation":"READ"') ||
      postData.includes('"operation": "READ"') ||
      postData.includes('"operation":"QUERY"') ||
      postData.includes('"operation": "QUERY"')
    ) {
      const isQuery =
        postData.includes('"operation":"QUERY"') ||
        postData.includes('"operation": "QUERY"');
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          isQuery
            ? companyHandlerListResponse(companies)
            : companyHandlerReadResponse(detailCompany)
        ),
      });
      return;
    }

    // Default: treat unknown companyHandler calls as READ for plan details
    // so the page's @if(!loading) guard resolves and the template renders.
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(companyHandlerReadResponse(detailCompany)),
    });
  });
}
