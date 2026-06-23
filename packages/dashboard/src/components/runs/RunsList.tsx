"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher, formatRelativeTime, formatDuration, getStatusColor, getStatusIcon } from "@/lib/utils";

export function RunsList() {
  const { data, isLoading, error } = useSWR("/api/runs?limit=50", fetcher, {
    refreshInterval: 5000,
  });

  const runs = data?.runs || [];

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-12">Loading test runs...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive text-lg">Failed to load test runs</p>
        <p className="text-muted-foreground text-sm mt-2">{error.message}</p>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No test runs yet</p>
        <p className="text-muted-foreground text-sm mt-2">
          Click &quot;Run Tests&quot; to execute your first test run.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run: { id: string; status: string; trigger: string; suite: string | null; totalTests: number; passed: number; failed: number; skipped: number; duration: number; startedAt: string }) => {
        const total = run.passed + run.failed + run.skipped;
        const passRate = total > 0 ? Math.round((run.passed / total) * 100) : 0;

        return (
          <Link
            key={run.id}
            href={`/runs/${run.id}`}
            className="block rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(run.status)}`}
                >
                  {getStatusIcon(run.status)} {run.status}
                </span>
                <div>
                  <p className="font-medium text-sm">
                    {run.suite || "All Tests"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {run.trigger} · {formatRelativeTime(run.startedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-medium">{total}</p>
                  <p className="text-xs text-muted-foreground">tests</p>
                </div>
                <div className="text-center">
                  <p className={`font-medium ${passRate >= 80 ? "text-green-600" : passRate >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                    {passRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">pass</p>
                </div>
                <div className="text-center">
                  <p className="font-medium">{formatDuration(run.duration)}</p>
                  <p className="text-xs text-muted-foreground">duration</p>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div className="mt-3 flex h-1.5 rounded-full overflow-hidden bg-muted">
                <div
                  className="bg-green-500"
                  style={{ width: `${(run.passed / total) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(run.failed / total) * 100}%` }}
                />
                <div
                  className="bg-yellow-500"
                  style={{ width: `${(run.skipped / total) * 100}%` }}
                />
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
