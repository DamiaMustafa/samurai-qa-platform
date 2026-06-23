"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetcher, formatRelativeTime, formatDuration, getStatusColor, getStatusIcon } from "@/lib/utils";

export function RecentRuns() {
  const { data, isLoading, error } = useSWR("/api/runs?limit=10", fetcher, {
    refreshInterval: 5000,
  });

  const runs = data?.runs || [];

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Recent Test Runs</h3>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="p-6 text-center text-sm text-destructive">
          Failed to load runs: {error.message}
        </div>
      ) : runs.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          No test runs yet. Click &quot;Run Tests&quot; to start.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Trigger
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Tests
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Pass Rate
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Duration
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Started
                </th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run: { id: string; status: string; trigger: string; totalTests: number; passed: number; failed: number; skipped: number; duration: number; startedAt: string }) => {
                const total = run.passed + run.failed + run.skipped;
                const passRate =
                  total > 0 ? Math.round((run.passed / total) * 100) : 0;

                return (
                  <tr key={run.id} className="border-b hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <Link href={`/runs/${run.id}`} className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                            run.status
                          )}`}
                        >
                          {getStatusIcon(run.status)} {run.status}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{run.trigger}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-green-600">{run.passed}</span>
                      {" / "}
                      <span className="text-red-600">{run.failed}</span>
                      {" / "}
                      <span className="text-yellow-600">{run.skipped}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {passRate}%
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDuration(run.duration)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatRelativeTime(run.startedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
