"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/utils";

interface Run {
  id: string;
  status: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  startedAt: string;
}

export function StatsCards() {
  const { data, error } = useSWR("/api/runs?limit=50", fetcher, {
    refreshInterval: 5000,
  });

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load stats: {error.message}
      </div>
    );
  }

  const runs: Run[] = data?.runs || [];
  const totalRuns = runs.length;
  const totalTests = runs.reduce((acc: number, r: Run) => acc + r.totalTests, 0);
  const totalPassed = runs.reduce((acc: number, r: Run) => acc + r.passed, 0);
  const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  const avgDuration =
    runs.length > 0
      ? Math.round(runs.reduce((acc: number, r: Run) => acc + r.duration, 0) / runs.length)
      : 0;

  const stats = [
    {
      title: "Total Runs",
      value: totalRuns.toString(),
      subtitle: "test executions",
      icon: "▶️",
      color: "text-blue-600",
    },
    {
      title: "Pass Rate",
      value: `${passRate}%`,
      subtitle: `${totalPassed} of ${totalTests} tests`,
      icon: "✓",
      color: passRate >= 80 ? "text-green-600" : "text-yellow-600",
    },
    {
      title: "Total Tests",
      value: totalTests.toString(),
      subtitle: "across all runs",
      icon: "📋",
      color: "text-purple-600",
    },
    {
      title: "Avg Duration",
      value: avgDuration > 1000 ? `${(avgDuration / 1000).toFixed(1)}s` : `${avgDuration}ms`,
      subtitle: "per run",
      icon: "⏱",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-lg border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </p>
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
            {stat.value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
