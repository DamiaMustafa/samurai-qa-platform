"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import { fetcher, formatDuration, formatDate, getStatusColor, getStatusIcon } from "@/lib/utils";

interface Step {
  title: string;
  status: string;
  duration: number;
  error?: string | null;
}

interface Result {
  id: number;
  suiteName: string;
  testName: string;
  status: string;
  duration: number;
  retries: number;
  errors: string[];
  screenshots: string[];
  steps: Step[];
  startedAt: string;
  completedAt: string;
}

interface RunData {
  id: string;
  status: string;
  trigger: string;
  suite: string | null;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  startedAt: string;
  completedAt: string | null;
  results: Result[];
}

export function RunDetail({ runId }: { runId: string }) {
  const { data, isLoading, error } = useSWR(`/api/runs/${runId}`, fetcher, {
    refreshInterval: (data: RunData | undefined) =>
      data?.status === "running" ? 2000 : 0,
  });

  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading run details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive font-medium">Failed to load run</p>
        <p className="text-destructive/80 text-sm mt-1">{error.message}</p>
        <Link href="/runs" className="text-sm text-primary hover:underline mt-3 inline-block">
          ← Back to runs
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Run not found
      </div>
    );
  }

  const run: RunData = data;
  const total = run.passed + run.failed + run.skipped;

  const toggleTest = (id: number) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Run Summary */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(run.status)}`}
            >
              {getStatusIcon(run.status)} {run.status}
            </span>
            <span className="text-sm text-muted-foreground capitalize">
              {run.trigger}
            </span>
            {run.suite && (
              <span className="text-sm text-muted-foreground">
                · Suite: {run.suite}
              </span>
            )}
          </div>
          <Link
            href="/runs"
            className="text-sm text-primary hover:underline"
          >
            ← Back to runs
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Started</p>
            <p className="font-medium">{formatDate(run.startedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{formatDuration(run.duration)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Passed</p>
            <p className="font-medium text-green-600">{run.passed}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="font-medium text-red-600">{run.failed}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Skipped</p>
            <p className="font-medium text-yellow-600">{run.skipped}</p>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-muted">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${(run.passed / total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(run.failed / total) * 100}%` }}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: `${(run.skipped / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Test Results */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Test Results ({run.results?.length || 0})
        </h3>

        {run.results?.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
            {run.status === "running"
              ? "Tests are running... Results will appear here."
              : "No test results recorded."}
          </div>
        ) : (
          run.results?.map((result: Result) => (
            <div
              key={result.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              <button
                onClick={() => toggleTest(result.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getStatusColor(result.status)}`}
                  >
                    {getStatusIcon(result.status)}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{result.testName}</p>
                    <p className="text-xs text-muted-foreground">
                      {result.suiteName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {formatDuration(result.duration)}
                  </span>
                  {result.retries > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {result.retries} retries
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {expandedTests.has(result.id) ? "▾" : "▸"}
                  </span>
                </div>
              </button>

              {expandedTests.has(result.id) && (
                <div className="border-t p-4 space-y-4">
                  {/* Steps */}
                  {result.steps.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Steps</p>
                      <div className="space-y-1">
                        {result.steps.map((step: Step, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm py-1"
                          >
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${getStatusColor(step.status)}`}
                            >
                              {getStatusIcon(step.status)}
                            </span>
                            <span className="flex-1">{step.title}</span>
                            <span className="text-muted-foreground text-xs">
                              {formatDuration(step.duration)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {result.errors.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-red-600">
                        Errors
                      </p>
                      {result.errors.map((err: string, i: number) => (
                        <pre
                          key={i}
                          className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800 overflow-x-auto whitespace-pre-wrap"
                        >
                          {err}
                        </pre>
                      ))}
                    </div>
                  )}

                  {/* Screenshots */}
                  {result.screenshots.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Screenshots</p>
                      <div className="flex gap-2 flex-wrap">
                        {result.screenshots.map((screenshot: string, i: number) => (
                          <div
                            key={i}
                            className="border rounded overflow-hidden"
                          >
                            <img
                              src={`/${screenshot}`}
                              alt={`Screenshot ${i + 1}`}
                              className="max-w-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
