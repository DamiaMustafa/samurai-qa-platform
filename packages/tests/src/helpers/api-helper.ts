import { type APIRequestContext, type Page } from "@playwright/test";

/**
 * API helper — make HTTP requests within tests.
 * Useful for setup/teardown via API instead of UI.
 */
export class ApiHelper {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string
  ) {}

  async get(endpoint: string, options?: Record<string, unknown>) {
    return this.request.get(`${this.baseUrl}${endpoint}`, options);
  }

  async post(endpoint: string, data?: Record<string, unknown>) {
    return this.request.post(`${this.baseUrl}${endpoint}`, {
      data,
    });
  }

  async put(endpoint: string, data?: Record<string, unknown>) {
    return this.request.put(`${this.baseUrl}${endpoint}`, {
      data,
    });
  }

  async delete(endpoint: string) {
    return this.request.delete(`${this.baseUrl}${endpoint}`);
  }

  async patch(endpoint: string, data?: Record<string, unknown>) {
    return this.request.patch(`${this.baseUrl}${endpoint}`, {
      data,
    });
  }
}

/**
 * Create an ApiHelper from a Playwright page's request context.
 */
export function createApiHelper(page: Page, baseUrl: string): ApiHelper {
  return new ApiHelper(page.request, baseUrl);
}
