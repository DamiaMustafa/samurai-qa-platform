import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig({ path: path.resolve(__dirname, "../../.env") });

export const envConfig = {
  baseUrl: process.env.BASE_URL || "https://staging.visionsamur.ai",
  apiBaseUrl: process.env.API_BASE_URL || "https://staging.visionsamur.ai/api",
  credentials: {
    admin: {
      username: process.env.ADMIN_USERNAME || process.env.STAGING_EMAIL || "",
      password: process.env.ADMIN_PASSWORD || process.env.STAGING_PASSWORD || "",
    },
    standard: {
      username: process.env.STANDARD_USERNAME || process.env.STAGING_EMAIL || "",
      password: process.env.STANDARD_PASSWORD || process.env.STAGING_PASSWORD || "",
    },
  },
  dashboardApiUrl:
    process.env.DASHBOARD_API_URL || "http://localhost:3000/api",
  timeout: parseInt(process.env.TEST_TIMEOUT || "60000", 10),
  retries: parseInt(process.env.TEST_RETRIES || "0", 10),
  workers: parseInt(process.env.TEST_WORKERS || "1", 10),
} as const;

export type EnvConfig = typeof envConfig;
