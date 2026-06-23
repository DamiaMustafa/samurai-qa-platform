"use client";

import useSWR from "swr";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { fetcher } from "@/lib/utils";

const COLORS = {
  passed: "#22c55e",
  failed: "#ef4444",
  skipped: "#eab308",
};

export function PassFailChart() {
  const { data } = useSWR("/api/runs?limit=1", fetcher, {
    refreshInterval: 5000,
  });

  const latestRun = data?.runs?.[0];

  if (!latestRun) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Latest Run Distribution</h3>
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          No test runs yet
        </div>
      </div>
    );
  }

  const chartData = [
    { name: "Passed", value: latestRun.passed, color: COLORS.passed },
    { name: "Failed", value: latestRun.failed, color: COLORS.failed },
    { name: "Skipped", value: latestRun.skipped, color: COLORS.skipped },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        Latest Run: {latestRun.passed + latestRun.failed + latestRun.skipped}{" "}
        tests
      </h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
