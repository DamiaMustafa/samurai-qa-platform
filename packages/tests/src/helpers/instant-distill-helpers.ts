import { type Page } from "@playwright/test";
import { createTinyPng } from "./test-dataset-factory";

/**
 * Instant Distill test helpers — shared utilities for E2E tests.
 */

// ── Mock Data ────────────────────────────────────────────────────────────────

export interface MockDistillProject {
  id: string;
  name: string;
  createdAt: string;
  projectType: string;
  thumbnailPath?: string;
}

/**
 * Create a set of mock distill projects for list page tests.
 */
export function createMockProjects(
  count: number,
  prefix = "Test Project"
): MockDistillProject[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `mock-distill-${i + 1}`,
    name: `${prefix} ${i + 1}`,
    createdAt: new Date(2025, 0, i + 1).toISOString(),
    projectType: "object_detection",
    thumbnailPath: "",
  }));
}

// ── GraphQL Mock Responses ───────────────────────────────────────────────────

/**
 * Build a mock GraphQL response for ListDistillProjectsByCompanyID.
 */
export function mockListProjectsResponse(projects: MockDistillProject[]) {
  return {
    data: {
      listDistillProjectsByCompanyID: {
        items: projects.map((p) => ({
          id: p.id,
          name: p.name,
          createdAt: p.createdAt,
          projectType: p.projectType,
          thumbnailPath: p.thumbnailPath || "",
          description: "",
          multiLabel: false,
          config: null,
          endpoint: null,
          company: { id: "mock-company", name: "Mock Company" },
          __typename: "DistillProject",
        })),
        nextToken: null,
        __typename: "ModelDistillProjectConnection",
      },
    },
  };
}

/**
 * Build a mock GraphQL response for GetDistillProject.
 */
export function mockGetProjectResponse(project: MockDistillProject) {
  return {
    data: {
      getDistillProject: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        projectType: project.projectType,
        thumbnailPath: project.thumbnailPath || "",
        description: "",
        multiLabel: false,
        config: { prompts: [], confidence: 0.5, confThreshold: 50 },
        endpoint: { created: false, baseUrl: "", method: "" },
        company: { id: "mock-company", name: "Mock Company" },
        __typename: "DistillProject",
      },
    },
  };
}

/**
 * Build an empty mock response for list predicted images/videos.
 */
export function mockEmptyPredictedResponse(type: "images" | "videos") {
  const key =
    type === "images"
      ? "listPredictedImagesByDistillProject"
      : "listPredictedVideosByDistillProject";
  return {
    data: {
      [key]: {
        items: [],
        nextToken: null,
        __typename:
          type === "images"
            ? "ModelPredictedImageConnection"
            : "ModelPredictedVideoConnection",
      },
    },
  };
}

/**
 * Build a mock success response for mutation operations.
 */
export function mockMutationResponse(
  operationName: string,
  id: string
) {
  return {
    data: {
      [operationName]: {
        id,
        name: "Mock Project",
        createdAt: new Date().toISOString(),
        projectType: "object_detection",
        __typename: "DistillProject",
      },
    },
  };
}

// ── Route Mocking ────────────────────────────────────────────────────────────

/**
 * Set up comprehensive GraphQL mocking for instant distill operations.
 * Intercepts all GraphQL requests and returns mock responses based on
 * the operation name in the request body.
 *
 * @param page — Playwright page instance
 * @param projects — mock projects to return from list queries
 * @returns object with methods to customize individual responses
 */
export async function mockDistillGraphQL(
  page: Page,
  projects: MockDistillProject[]
): Promise<void> {
  await page.route("**/graphql", async (route) => {
    const postData = route.request().postData() || "";

    if (postData.includes("ListDistillProjectsByCompanyID")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockListProjectsResponse(projects)),
      });
      return;
    }

    if (postData.includes("GetDistillProject") || postData.includes("getDistillProject")) {
      const project = projects[0] || createMockProjects(1)[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockGetProjectResponse(project)),
      });
      return;
    }

    if (postData.includes("ListPredictedImagesByDistillProject")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEmptyPredictedResponse("images")),
      });
      return;
    }

    if (postData.includes("ListPredictedVideosByDistillProject")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEmptyPredictedResponse("videos")),
      });
      return;
    }

    if (postData.includes("UpdateDistillProject") || postData.includes("updateDistillProject")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          mockMutationResponse("updateDistillProject", projects[0]?.id || "mock-1")
        ),
      });
      return;
    }

    if (postData.includes("DeleteDistillProject") || postData.includes("deleteDistillProject")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          mockMutationResponse("deleteDistillProject", projects[0]?.id || "mock-1")
        ),
      });
      return;
    }

    if (postData.includes("CreateDistillProject") || postData.includes("createDistillProject")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          mockMutationResponse("createDistillProject", "new-distill-id")
        ),
      });
      return;
    }

    if (postData.includes("ManagePredictedImages") || postData.includes("managePredictedImages")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { managePredictedImages: { ok: true, error: null, message: null } },
        }),
      });
      return;
    }

    // Pass through any unmatched GraphQL requests
    await route.continue();
  });
}

// ── Image / File Helpers ─────────────────────────────────────────────────────

/**
 * Create a test image file object ready for setInputFiles.
 */
export function createTestImage(name = "test-image.png"): {
  name: string;
  mimeType: string;
  buffer: Buffer;
} {
  return {
    name,
    mimeType: "image/png",
    buffer: createTinyPng(),
  };
}

/**
 * Create multiple test image file objects.
 */
export function createTestImages(
  count: number,
  prefix = "test-image"
): { name: string; mimeType: string; buffer: Buffer }[] {
  return Array.from({ length: count }, (_, i) =>
    createTestImage(`${prefix}-${i + 1}.png`)
  );
}

/**
 * Create a fake video buffer (not a valid MP4 — just a placeholder).
 * The browser cannot parse its metadata, so duration checks will not
 * trigger client-side. Use page.evaluate() to mock duration if needed.
 */
export function createFakeVideoBuffer(): Buffer {
  const header = Buffer.from([
    0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x6d, 0x70, 0x34, 0x31,
  ]);
  return Buffer.concat([header, Buffer.alloc(512, 0)]);
}

// ── Toast Waiter ─────────────────────────────────────────────────────────────

/**
 * Poll for a toast notification containing the expected text.
 */
export async function waitForToast(
  page: Page,
  textFragment: string,
  timeout = 10_000
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const toasts = page.locator(
      ".toast, [class*='toast'], [class*='snack'], [class*='notification']"
    );
    const count = await toasts.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const text = await toasts.nth(i).textContent().catch(() => "");
      if (text && text.includes(textFragment)) return true;
    }
    await page.waitForTimeout(500);
  }
  return false;
}
