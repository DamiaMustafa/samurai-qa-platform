"use client";

import { useState, useEffect } from "react";

interface SettingsData {
  environment?: {
    baseUrl: string;
    apiBaseUrl: string;
    credentials: {
      admin: { username: string; password: string };
      standard: { username: string; password: string };
    };
    timeout: number;
    retries: number;
    workers: number;
  };
}

const DEFAULT_SETTINGS: NonNullable<SettingsData["environment"]> = {
  baseUrl: "https://staging.visionsamur.ai",
  apiBaseUrl: "https://staging.visionsamur.ai/api",
  credentials: {
    admin: { username: "", password: "" },
    standard: { username: "", password: "" },
  },
  timeout: 60000,
  retries: 0,
  workers: 1,
};

export function SettingsForm() {
  const [settings, setSettings] = useState<NonNullable<SettingsData["environment"]>>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SettingsData) => {
        if (data.environment) {
          setSettings(data.environment);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ environment: settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
    setSaving(false);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const start = Date.now();
      const response = await fetch(settings.baseUrl, {
        method: "HEAD",
        mode: "no-cors",
      });
      const elapsed = Date.now() - start;
      // no-cors always returns "opaque" so we can't check status, but it means the server responded
      setTestResult(`✓ Connection successful (${elapsed}ms)`);
    } catch (error) {
      setTestResult(`✗ Connection failed: ${(error as Error).message}`);
    }
    setTesting(false);
  };

  const updateField = (
    path: string,
    value: string | number
  ) => {
    setSettings((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj: Record<string, unknown> = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* URLs */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Environment URLs</h3>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Base URL
          </label>
          <input
            type="url"
            value={settings.baseUrl}
            onChange={(e) => updateField("baseUrl", e.target.value)}
            className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            API Base URL
          </label>
          <input
            type="url"
            value={settings.apiBaseUrl}
            onChange={(e) => updateField("apiBaseUrl", e.target.value)}
            className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <button
          onClick={testConnection}
          disabled={testing}
          className="text-sm px-3 py-1.5 rounded border hover:bg-accent disabled:opacity-50"
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>
        {testResult && (
          <p
            className={`text-sm ${testResult.startsWith("✓") ? "text-green-600" : "text-red-600"}`}
          >
            {testResult}
          </p>
        )}
      </div>

      {/* Credentials */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Test Credentials</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Admin Username
            </label>
            <input
              type="text"
              value={settings.credentials.admin.username}
              onChange={(e) =>
                updateField("credentials.admin.username", e.target.value)
              }
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Admin Password
            </label>
            <input
              type="password"
              value={settings.credentials.admin.password}
              onChange={(e) =>
                updateField("credentials.admin.password", e.target.value)
              }
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Standard User Username
            </label>
            <input
              type="text"
              value={settings.credentials.standard.username}
              onChange={(e) =>
                updateField("credentials.standard.username", e.target.value)
              }
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Standard User Password
            </label>
            <input
              type="password"
              value={settings.credentials.standard.password}
              onChange={(e) =>
                updateField("credentials.standard.password", e.target.value)
              }
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Test Config */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Test Configuration</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Timeout (ms)
            </label>
            <input
              type="number"
              value={settings.timeout}
              onChange={(e) =>
                updateField("timeout", parseInt(e.target.value))
              }
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Retries
            </label>
            <input
              type="number"
              value={settings.retries}
              onChange={(e) =>
                updateField("retries", parseInt(e.target.value))
              }
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Workers
            </label>
            <input
              type="number"
              value={settings.workers}
              onChange={(e) =>
                updateField("workers", parseInt(e.target.value))
              }
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && (
          <span className="text-sm text-green-600">✓ Settings saved</span>
        )}
      </div>
    </div>
  );
}
