"use client";

import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetcher } from "@/lib/utils";

export function TrendChart() {
  const { data } = useSWR("/api/runs?limit=10", fetcher, {
    refreshInterval: 5000,
  });

  const runs = (data?.runs || []).reverse();

  const chartData = runs.map((run: { startedAt: string; passed: number; failed: number; skipped: number; totalTests: number }) => {
    const total = run.passed + run.failed + run.skipped;
    const rate = total > 0 ? Math.round((run.passed / total) * 100) : 0;
    return {
      date: new Date(run.startedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      passRate: rate,
      total,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Pass Rate Trend</h3>
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          No data yet — run some tests to see trends
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Pass Rate Trend</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis domain={[0, 100]} fontSize={12} unit="%" />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Pass Rate"]}
            />
            <Line
              type="monotone"
              dataKey="passRate"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ fill: "#22c55e", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
