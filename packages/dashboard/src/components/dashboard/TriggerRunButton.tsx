"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TriggerRunButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [suite, setSuite] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const triggerRun = async (suiteFilter?: string) => {
    setIsRunning(true);
    setShowDropdown(false);
    setError(null);
    try {
      const response = await fetch("/api/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suite: suiteFilter || undefined,
          trigger: "manual",
        }),
      });

      if (response.ok) {
        const { runId } = await response.json();
        router.push(`/runs/${runId}`);
      } else {
        const data = await response.json().catch(() => null);
        setError(data?.error || `Failed to start run (${response.status})`);
        setIsRunning(false);
      }
    } catch (err) {
      console.error("Failed to trigger run:", err);
      setError("Could not reach the server. Is the dashboard running?");
      setIsRunning(false);
    }
  };

  const suites = [
    { label: "All Tests", value: undefined },
    { label: "Smoke Tests", value: "@smoke" },
    { label: "Auth Tests", value: "@auth" },
    { label: "Dashboard Tests", value: "@dashboard" },
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Custom grep filter..."
          value={suite}
          onChange={(e) => setSuite(e.target.value)}
          className="h-9 w-48 rounded-md border border-input bg-background px-3 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && suite) triggerRun(suite);
          }}
        />
        <button
          onClick={() => triggerRun(suite || undefined)}
          disabled={isRunning}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isRunning ? "Starting..." : "▶ Run Tests"}
        </button>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="h-9 w-9 rounded-md border flex items-center justify-center hover:bg-accent"
        >
          ▾
        </button>
      </div>

      {error && (
        <div className="absolute right-0 top-full mt-2 max-w-xs rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <div className="flex items-start justify-between gap-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="shrink-0 text-destructive/60 hover:text-destructive"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-card shadow-lg z-50">
          {suites.map((s) => (
            <button
              key={s.label}
              onClick={() => triggerRun(s.value)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-accent first:rounded-t-md last:rounded-b-md"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
