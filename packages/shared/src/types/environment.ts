export interface EnvironmentConfig {
  name: string; // e.g., "staging", "production"
  baseUrl: string;
  apiBaseUrl: string;
  credentials: {
    admin: { username: string; password: string };
    standard: { username: string; password: string };
  };
  timeout: number; // default timeout in ms
  retries: number; // default retry count
  workers: number; // parallel workers
}
