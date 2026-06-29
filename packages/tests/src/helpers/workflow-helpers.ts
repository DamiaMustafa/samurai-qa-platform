import { type Page } from "@playwright/test";

/**
 * Workflow test helpers — shared utilities for E2E tests.
 */

// ── Mock Data Interfaces ──────────────────────────────────────────────────────

export interface MockWorkflow {
  id: string;
  name: string;
  companyId: string;
  createdAt: string;
  steps: string; // JSON stringified array of workflow steps
}

export interface MockDeployedModel {
  id: string;
  name: string;
  projectType: string; // "object_detection" | "classification" | "segmentation"
  status: string; // "IN_SERVICE"
  endpoint: string;
  f1Score: number;
  precision: number;
  recall: number;
}

export interface MockModelHubItem {
  id: string;
  name: string;
  archType: string; // "DETECTION" | "CLASSIFICATION" | "SEGMENTATION"
  default: string; // "yes"
}

// ── Factory Functions ─────────────────────────────────────────────────────────

/**
 * Create a single mock workflow with sensible defaults.
 */
export function createMockWorkflow(overrides: Partial<MockWorkflow> = {}): MockWorkflow {
  return {
    id: "mock-workflow-1",
    name: "Test Workflow",
    companyId: "mock-company",
    createdAt: new Date().toISOString(),
    steps: JSON.stringify([
      { type: "input", name: "Input Data", config: {} },
      { type: "model", name: "Run Model", config: { modelId: "mock-model-1" } },
      { type: "output", name: "Output", config: {} },
    ]),
    ...overrides,
  };
}

/**
 * Create a list of mock workflows with sequential IDs and names.
 */
export function createMockWorkflowList(
  count: number,
  prefix = "Test Workflow"
): MockWorkflow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-workflow-${i + 1}`,
    name: `${prefix} ${i + 1}`,
    companyId: "mock-company",
    createdAt: new Date(2025, 0, i + 1).toISOString(),
    steps: JSON.stringify([
      { type: "input", name: "Input Data", config: {} },
      { type: "model", name: "Run Model", config: { modelId: `mock-model-${i + 1}` } },
      { type: "output", name: "Output", config: {} },
    ]),
  }));
}

/**
 * Create a single mock deployed model.
 */
export function createMockDeployedModel(
  overrides: Partial<MockDeployedModel> = {}
): MockDeployedModel {
  return {
    id: "mock-deployed-model-1",
    name: "Test Deployed Model",
    projectType: "object_detection",
    status: "IN_SERVICE",
    endpoint: "https://api.example.com/v1/inference/mock-model-1",
    f1Score: 0.92,
    precision: 0.91,
    recall: 0.93,
    ...overrides,
  };
}

/**
 * Create a list of mock deployed models.
 */
export function createMockDeployedModelList(count: number): MockDeployedModel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-deployed-model-${i + 1}`,
    name: `Deployed Model ${i + 1}`,
    projectType: "object_detection" as const,
    status: "IN_SERVICE" as const,
    endpoint: `https://api.example.com/v1/inference/mock-model-${i + 1}`,
    f1Score: 0.9 + (i + 1) * 0.01,
    precision: 0.89 + (i + 1) * 0.01,
    recall: 0.91 + (i + 1) * 0.01,
  }));
}

/**
 * Create a list of mock model hub items.
 */
export function createMockModelHubList(count: number): MockModelHubItem[] {
  const archTypes = ["DETECTION", "CLASSIFICATION", "SEGMENTATION"] as const;
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-model-hub-${i + 1}`,
    name: `Hub Model ${i + 1}`,
    archType: archTypes[i % archTypes.length],
    default: "yes",
  }));
}

// ── Pre-built Mocks ───────────────────────────────────────────────────────────

export const MOCK_WORKFLOWS = {
  simple: createMockWorkflow({ name: "Simple Workflow" }),
  withSteps: createMockWorkflow({
    name: "Steps Workflow",
    steps: JSON.stringify([
      { type: "input", name: "Upload Images", config: { acceptType: "image/*" } },
      { type: "model", name: "Object Detector", config: { modelId: "det-model-1", confThreshold: 0.5 } },
      { type: "filter", name: "Filter Results", config: { minConfidence: 0.7 } },
      { type: "output", name: "Export Predictions", config: { format: "json" } },
    ]),
  }),
  empty: createMockWorkflow({ name: "Empty Workflow", steps: "[]" }),
};

// ── GraphQL Mock Response Builders ────────────────────────────────────────────

/**
 * Build a mock GraphQL response for listWorkflowByCompanyID.
 */
function mockListWorkflowsResponse(workflows: MockWorkflow[]) {
  return {
    data: {
      listWorkflowByCompanyID: {
        items: workflows.map((w) => ({
          id: w.id,
          name: w.name,
          companyId: w.companyId,
          createdAt: w.createdAt,
          steps: w.steps,
          __typename: "Workflow",
        })),
        nextToken: null,
        __typename: "ModelWorkflowConnection",
      },
    },
  };
}

/**
 * Build a mock GraphQL response for getWorkflow.
 */
function mockGetWorkflowResponse(workflow: MockWorkflow) {
  return {
    data: {
      getWorkflow: {
        id: workflow.id,
        name: workflow.name,
        companyId: workflow.companyId,
        createdAt: workflow.createdAt,
        steps: workflow.steps,
        __typename: "Workflow",
      },
    },
  };
}

/**
 * Build a mock GraphQL response for createWorkflow.
 */
function mockCreateWorkflowResponse(input: Partial<MockWorkflow>) {
  return {
    data: {
      createWorkflow: {
        id: "new-workflow-id",
        name: input.name || "New Workflow",
        companyId: input.companyId || "mock-company",
        createdAt: new Date().toISOString(),
        steps: input.steps || "[]",
        __typename: "Workflow",
      },
    },
  };
}

/**
 * Build a mock GraphQL response for updateWorkflow.
 */
function mockUpdateWorkflowResponse(workflow: MockWorkflow) {
  return {
    data: {
      updateWorkflow: {
        id: workflow.id,
        name: workflow.name,
        companyId: workflow.companyId,
        createdAt: workflow.createdAt,
        steps: workflow.steps,
        __typename: "Workflow",
      },
    },
  };
}

/**
 * Build a mock GraphQL response for deleteWorkflow.
 */
function mockDeleteWorkflowResponse(id: string) {
  return {
    data: {
      deleteWorkflow: {
        id,
        __typename: "Workflow",
      },
    },
  };
}

/**
 * Build an empty mock response for listDeployByCompanyID.
 */
function mockEmptyDeployedModelsResponse() {
  return {
    data: {
      listDeployByCompanyID: {
        items: [],
        nextToken: null,
        __typename: "ModelDeployConnection",
      },
    },
  };
}

/**
 * Build an empty mock response for QueryModelHub.
 */
function mockEmptyModelHubResponse() {
  return {
    data: {
      QueryModelHub: {
        items: [],
        nextToken: null,
        __typename: "ModelModelHubItemConnection",
      },
    },
  };
}

// ── Route Mocking ─────────────────────────────────────────────────────────────

/**
 * Set up comprehensive GraphQL mocking for workflow operations.
 * Intercepts all GraphQL requests and returns mock responses based on
 * the operation name in the request body.
 *
 * @param page — Playwright page instance
 * @param workflows — mock workflows to return from list queries
 */
export async function mockWorkflowGraphQL(
  page: Page,
  workflows: MockWorkflow[]
): Promise<void> {
  await page.route("**/graphql", async (route) => {
    const postData = route.request().postData() || "";

    if (
      postData.includes("listWorkflowByCompanyID") ||
      postData.includes("ListWorkflowByCompanyID")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockListWorkflowsResponse(workflows)),
      });
      return;
    }

    if (
      postData.includes("getWorkflow") ||
      postData.includes("GetWorkflow")
    ) {
      const workflow = workflows[0] || createMockWorkflow();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockGetWorkflowResponse(workflow)),
      });
      return;
    }

    if (
      postData.includes("createWorkflow") ||
      postData.includes("CreateWorkflow")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCreateWorkflowResponse(workflows[0] || {})),
      });
      return;
    }

    if (
      postData.includes("updateWorkflow") ||
      postData.includes("UpdateWorkflow")
    ) {
      const workflow = workflows[0] || createMockWorkflow();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockUpdateWorkflowResponse(workflow)),
      });
      return;
    }

    if (
      postData.includes("deleteWorkflow") ||
      postData.includes("DeleteWorkflow")
    ) {
      const id = workflows[0]?.id || "mock-workflow-1";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockDeleteWorkflowResponse(id)),
      });
      return;
    }

    if (
      postData.includes("listDeployByCompanyID") ||
      postData.includes("ListDeployByCompanyID")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEmptyDeployedModelsResponse()),
      });
      return;
    }

    if (
      postData.includes("QueryModelHub") ||
      postData.includes("queryModelHub")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEmptyModelHubResponse()),
      });
      return;
    }

    // Pass through any unmatched GraphQL requests
    await route.continue();
  });
}

// ── REST Mocking ──────────────────────────────────────────────────────────────

/**
 * Intercept the workflow prototype Lambda URL and return a mock output.
 *
 * @param page — Playwright page instance
 * @param output — optional custom output to return (default: mock predictions)
 */
export async function mockWorkflowRun(
  page: Page,
  output?: Record<string, unknown>
): Promise<void> {
  const defaultOutput = output ?? {
    output: [
      { key: "images", value: ["https://example.com/output.png"] },
      {
        key: "predictions",
        value: [{ class: "car", confidence: 0.95 }],
      },
    ],
  };

  // Mock the workflow prototype Lambda function URL.
  // IMPORTANT: Do NOT use **/*workflow* — it catches page navigation URLs
  // like /workflow-listing and /workflow/:id, returning JSON instead of HTML.
  // The actual API calls go to AWS Lambda function URLs (*.lambda-url.*).
  await page.route("**/*.lambda-url.**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultOutput),
    });
  });
}

// ── Convenience ───────────────────────────────────────────────────────────────

/**
 * Set up all workflow API mocks at once (GraphQL + workflow run).
 *
 * @param page — Playwright page instance
 * @param workflows — mock workflows to return from list queries
 */
export async function mockAllWorkflowAPIs(
  page: Page,
  workflows: MockWorkflow[]
): Promise<void> {
  await mockWorkflowGraphQL(page, workflows);
  await mockWorkflowRun(page);
}