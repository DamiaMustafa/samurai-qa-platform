import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig({ path: path.resolve(__dirname, "../../.env") });

// ── Multi-env resolution ────────────────────────────────
const env = (process.env.ACTIVE_ENV || "staging").toUpperCase();

const resolvedBaseUrl =
  process.env.BASE_URL ||
  process.env[`${env}_BASE_URL`] ||
  "https://staging.visionsamur.ai";

const resolvedApiBaseUrl =
  process.env.API_BASE_URL ||
  process.env[`${env}_API_BASE_URL`] ||
  `${resolvedBaseUrl.replace(/\/$/, "")}/api`;

const resolvedEmail =
  process.env.TEST_EMAIL || process.env[`${env}_EMAIL`] || "";

const resolvedPassword =
  process.env.TEST_PASSWORD || process.env[`${env}_PASSWORD`] || "";

export const envConfig = {
  /** Active environment name (staging, dev, prod) */
  name: env.toLowerCase(),
  baseUrl: resolvedBaseUrl,
  apiBaseUrl: resolvedApiBaseUrl,
  credentials: {
    admin: {
      username: process.env.ADMIN_USERNAME || resolvedEmail,
      password: process.env.ADMIN_PASSWORD || resolvedPassword,
    },
    standard: {
      username: process.env.STANDARD_USERNAME || resolvedEmail,
      password: process.env.STANDARD_PASSWORD || resolvedPassword,
    },
    google: {
      email: process.env.GOOGLE_EMAIL || "",
      password: process.env.GOOGLE_PASSWORD || "",
    },
  },
  dashboardApiUrl:
    process.env.DASHBOARD_API_URL || "http://localhost:3000/api",
  timeout: parseInt(process.env.TEST_TIMEOUT || "60000", 10),
  retries: parseInt(process.env.TEST_RETRIES || "0", 10),
  workers: parseInt(process.env.TEST_WORKERS || "1", 10),
} as const;

export type EnvConfig = typeof envConfig;
