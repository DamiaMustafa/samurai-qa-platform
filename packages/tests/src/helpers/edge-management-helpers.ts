import { type Page } from "@playwright/test";

/**
 * Edge Management test helpers — mock data, GraphQL & REST route mocking
 * for edge device listing, version, license, and delete operations.
 *
 * Mirrors the pattern from instant-distill-helpers.ts.
 */

// ── Mock Data ────────────────────────────────────────────────────────────────

export interface MockEdgeDevice {
  GreengrassGroupName: string;
  ClientName: string;
  CreatedDate: string;
  companyId: string;
  softwareVersion: {
    Inference: string;
    Middleware: string;
    Frontend: string;
  };
  webPortal: string;
  apiDocumentation: string;
  systemMonitoring: string;
  licenseKey?: string;
  licenseStartDate?: string;
  licenseEndDate?: string;
  publicKey?: string;
  DeploymentStatus?: string;
}

export interface MockLatestVersion {
  inference: string;
  middleware: string;
  frontend: string;
}

/**
 * Create a mock edge device.
 */
export function createMockEdgeDevice(
  overrides: Partial<MockEdgeDevice> = {}
): MockEdgeDevice {
  const index = overrides.GreengrassGroupName
    ? 0
    : Math.floor(Math.random() * 1000);
  return {
    GreengrassGroupName: `edge-device-group-${index}`,
    ClientName: `Client ${index}`,
    CreatedDate: `2025-0${(index % 9) + 1}-15T10:00:00.000Z`,
    companyId: "mock-company-001",
    softwareVersion: {
      Inference: "1.2.3",
      Middleware: "2.3.4",
      Frontend: "3.4.5",
    },
    webPortal: "https://portal.example.com",
    apiDocumentation: "https://docs.example.com",
    systemMonitoring: "https://monitoring.example.com",
    DeploymentStatus: "SUCCESS",
    ...overrides,
  };
}

/**
 * Create a list of mock edge devices.
 */
export function createMockEdgeDeviceList(
  count: number,
  prefix = "edge-device"
): MockEdgeDevice[] {
  return Array.from({ length: count }, (_, i) =>
    createMockEdgeDevice({
      GreengrassGroupName: `${prefix}-group-${i + 1}`,
      ClientName: `Client ${String.fromCharCode(65 + (i % 26))}`,
      CreatedDate: new Date(2025, 0, i + 1).toISOString(),
    })
  );
}

/**
 * Pre-built mock devices for common scenarios.
 */
export const MOCK_EDGE_DEVICES = {
  withLicense: createMockEdgeDevice({
    GreengrassGroupName: "licensed-device-group",
    ClientName: "Licensed Corp",
    licenseKey:
      "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890",
    licenseStartDate: "2025-01-01T00:00:00.000Z",
    licenseEndDate: "2026-01-01T00:00:00.000Z",
    publicKey: "mock-public-key-abc123",
  }),

  noLicense: createMockEdgeDevice({
    GreengrassGroupName: "unlicensed-device-group",
    ClientName: "Unlicensed Corp",
  }),

  withVersion: createMockEdgeDevice({
    GreengrassGroupName: "versioned-device-group",
    softwareVersion: {
      Inference: "1.5.0",
      Middleware: "2.1.0",
      Frontend: "3.0.1",
    },
  }),
};

export const MOCK_LATEST_VERSION: MockLatestVersion = {
  inference: "1.6.0",
  middleware: "2.2.0",
  frontend: "3.1.0",
};

// ── GraphQL Mock Responses ───────────────────────────────────────────────────

function edgeDeviceListResponse(devices: MockEdgeDevice[]) {
  return {
    data: {
      // Must match the GraphQL query field name: listDevicesByCompanyAndCreatedDate
      listDevicesByCompanyAndCreatedDate: {
        items: devices.map((d) => ({
          __typename: "EdgeDevice",
          GreengrassGroupName: d.GreengrassGroupName,
          ClientName: d.ClientName,
          CreatedDate: d.CreatedDate,
          companyId: d.companyId,
          DeploymentStatus: d.DeploymentStatus || "SUCCESS",
          softwareVersion: d.softwareVersion,
          FRP_INFO: {
            API: d.webPortal,
            FRONTEND: d.apiDocumentation,
            NETDATA: d.systemMonitoring,
          },
          GG_INFO: {
            GreengrassGroupId: `gg-${d.GreengrassGroupName}`,
            IoTEndpoint: "https://iot.example.com",
          },
          licenseKey: d.licenseKey || null,
          licenseStartDate: d.licenseStartDate || null,
          licenseEndDate: d.licenseEndDate || null,
          publicKey: d.publicKey || null,
        })),
        nextToken: null,
        __typename: "EdgeDeviceConnection",
      },
    },
  };
}

function edgeDeviceSAResponse(devices: MockEdgeDevice[]) {
  return {
    data: {
      // Must match the GraphQL query field name: listDevicesBySuperAdminAndCreatedDate
      listDevicesBySuperAdminAndCreatedDate: {
        items: devices.map((d) => ({
          __typename: "EdgeDevice",
          GreengrassGroupName: d.GreengrassGroupName,
          ClientName: d.ClientName,
          CreatedDate: d.CreatedDate,
          companyId: d.companyId,
          DeploymentStatus: d.DeploymentStatus || "SUCCESS",
          softwareVersion: d.softwareVersion,
          FRP_INFO: {
            API: d.webPortal,
            FRONTEND: d.apiDocumentation,
            NETDATA: d.systemMonitoring,
          },
          GG_INFO: {
            GreengrassGroupId: `gg-${d.GreengrassGroupName}`,
            IoTEndpoint: "https://iot.example.com",
          },
          licenseKey: d.licenseKey || null,
          licenseStartDate: d.licenseStartDate || null,
          licenseEndDate: d.licenseEndDate || null,
          publicKey: d.publicKey || null,
        })),
        nextToken: null,
        __typename: "EdgeDeviceConnection",
      },
    },
  };
}

function edgeDeviceHandlerResponse(devices: MockEdgeDevice[]) {
  return {
    data: {
      edgeDeviceHandler: {
        items: devices.map((d) => ({
          __typename: "EdgeDevice",
          GreengrassGroupName: d.GreengrassGroupName,
          ClientName: d.ClientName,
          CreatedDate: d.CreatedDate,
          companyId: d.companyId,
          DeploymentStatus: d.DeploymentStatus || "SUCCESS",
          softwareVersion: d.softwareVersion,
          FRP_INFO: {
            API: d.webPortal,
            FRONTEND: d.apiDocumentation,
            NETDATA: d.systemMonitoring,
          },
          GG_INFO: {
            GreengrassGroupId: `gg-${d.GreengrassGroupName}`,
            IoTEndpoint: "https://iot.example.com",
          },
          licenseKey: d.licenseKey || null,
          licenseStartDate: d.licenseStartDate || null,
          licenseEndDate: d.licenseEndDate || null,
          publicKey: d.publicKey || null,
        })),
        nextToken: null,
        __typename: "EdgeDeviceHandlerResponse",
      },
    },
  };
}

function getEdgeDeviceResponse(device: MockEdgeDevice) {
  return {
    data: {
      getEdgeDevice: {
        __typename: "EdgeDevice",
        GreengrassGroupName: device.GreengrassGroupName,
        ClientName: device.ClientName,
        CreatedDate: device.CreatedDate,
        companyId: device.companyId,
        DeploymentStatus: device.DeploymentStatus || "SUCCESS",
        softwareVersion: device.softwareVersion,
        FRP_INFO: {
          API: device.webPortal,
          FRONTEND: device.apiDocumentation,
          NETDATA: device.systemMonitoring,
        },
        GG_INFO: {
          GreengrassGroupId: `gg-${device.GreengrassGroupName}`,
          IoTEndpoint: "https://iot.example.com",
        },
        licenseKey: device.licenseKey || null,
        licenseStartDate: device.licenseStartDate || null,
        licenseEndDate: device.licenseEndDate || null,
        publicKey: device.publicKey || null,
      },
    },
  };
}

// ── Route Mocking ────────────────────────────────────────────────────────────

/**
 * Set up comprehensive GraphQL mocking for edge device operations.
 * Handles both superadmin (edgeDeviceHandler) and company-scoped
 * (listEdgeDeviceByCompanyAndCreatedDate) queries.
 *
 * @param page — Playwright page instance
 * @param devices — mock edge devices to return
 */
export async function mockEdgeDeviceGraphQL(
  page: Page,
  devices: MockEdgeDevice[]
): Promise<void> {
  await page.route("**/graphql", async (route) => {
    const postData = route.request().postData() || "";

    // Superadmin handler query
    if (
      postData.includes("edgeDeviceHandler") ||
      postData.includes("EdgeDeviceHandler")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(edgeDeviceHandlerResponse(devices)),
      });
      return;
    }

    // Superadmin list by created date
    if (
      postData.includes("listEdgeDeviceSAByCD") ||
      postData.includes("ListDevicesBySuperAdminAndCreatedDate")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(edgeDeviceSAResponse(devices)),
      });
      return;
    }

    // Company-scoped list by created date
    if (
      postData.includes("listEdgeDeviceByCD") ||
      postData.includes("ListDevicesByCompanyAndCreatedDate")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(edgeDeviceListResponse(devices)),
      });
      return;
    }

    // Get single edge device (after license generation)
    if (
      postData.includes("getEdgeDevice") ||
      postData.includes("GetEdgeDevice")
    ) {
      const device = devices[0] || createMockEdgeDevice();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(getEdgeDeviceResponse(device)),
      });
      return;
    }

    // Other edge device queries — return the same list
    if (
      postData.includes("listEdgeDevice") ||
      postData.includes("ListEdgeDevice")
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(edgeDeviceListResponse(devices)),
      });
      return;
    }

    // Pass through non-edge GraphQL requests
    await route.continue();
  });
}

/**
 * Mock the REST endpoint for getting the latest application version.
 */
export async function mockLatestVersion(
  page: Page,
  version: MockLatestVersion = MOCK_LATEST_VERSION
): Promise<void> {
  await page.route("**/application/latest_version**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        inference: {
          staging: { version: version.inference },
          production: { version: version.inference },
        },
        middleware: {
          staging: { version: version.middleware },
          production: { version: version.middleware },
        },
        "frontend/viewer": {
          staging: { version: version.frontend },
          production: { version: version.frontend },
        },
      }),
    });
  });
}

/**
 * Mock the REST endpoint for deleting an edge device deployment.
 * @param statusCode — status code to return (200 = success, 503 = treated as success)
 */
export async function mockDeleteDeployment(
  page: Page,
  statusCode: number = 200
): Promise<{ deleteCalled: () => boolean }> {
  let called = false;

  await page.route("**/application/delete**", async (route) => {
    called = true;
    if (statusCode === 200) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Deployment deleted successfully" }),
      });
    } else if (statusCode === 503) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Service temporarily unavailable",
        }),
      });
    } else {
      await route.fulfill({
        status: statusCode,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "Internal server error",
        }),
      });
    }
  });

  return { deleteCalled: () => called };
}

/**
 * Mock the REST endpoint for license operations (generate, download, revoke).
 */
export async function mockLicenseOperations(
  page: Page,
  options: {
    generatedKey?: string;
    failGenerate?: boolean;
  } = {}
): Promise<{ generateCalled: () => boolean; revokeCalled: () => boolean }> {
  let generateCalled = false;
  let revokeCalled = false;

  const generatedKey =
    options.generatedKey ||
    "mock-generated-license-key-abc123def456ghi789jkl012mno345pqr678";

  await page.route(
    "**/*lambda-url*/**",
    async (route) => {
      const postData = route.request().postData() || "";

      let input: any = {};
      try {
        input = JSON.parse(postData);
      } catch {
        // fallback
      }

      const operation = input?.operation;

      if (operation === "post") {
        generateCalled = true;
        if (options.failGenerate) {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              error: "Failed to generate license",
            }),
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              license_key: generatedKey,
              public_key: "mock-public-key",
              start_date: input?.startDate,
              end_date: input?.endDate,
            }),
          });
        }
        return;
      }

      if (operation === "download") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            license_key: generatedKey,
            public_key: "mock-public-key",
            file_content: "mock-license-file-content",
          }),
        });
        return;
      }

      if (operation === "revoke") {
        revokeCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "License revoked successfully",
          }),
        });
        return;
      }

      await route.continue();
    }
  );

  return {
    generateCalled: () => generateCalled,
    revokeCalled: () => revokeCalled,
  };
}

/**
 * Mock all Edge Management API calls at once.
 * Convenience wrapper for the common test setup pattern.
 */
export async function mockAllEdgeAPIs(
  page: Page,
  devices: MockEdgeDevice[],
  version: MockLatestVersion = MOCK_LATEST_VERSION
): Promise<void> {
  await mockEdgeDeviceGraphQL(page, devices);
  await mockLatestVersion(page, version);
}
