"use client";

import useSWR from "swr";
import { useState, useMemo } from "react";
import { getStatusColor, getStatusIcon } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TestCaseData {
  name: string;
  suite: string;
  status: string;
  lastRun: string;
  runCount: number;
}

export function TestCaseBrowser() {
  const { data, isLoading } = useSWR("/api/runs?limit=50", fetcher, {
    refreshInterval: 10000,
  });

  const [search, setSearch] = useState("");
  const [suiteFilter, setSuiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Derive test cases from run results
  const testCases = useMemo(() => {
    if (!data?.runs) return [];

    const caseMap = new Map<string, TestCaseData>();

    for (const run of data.runs) {
      if (!run.results) continue;
      for (const result of run.results) {
        const key = `${result.suiteName}::${result.testName}`;
        const existing = caseMap.get(key);
        if (!existing || new Date(result.completedAt) > new Date(existing.lastRun)) {
          caseMap.set(key, {
            name: result.testName,
            suite: result.suiteName,
            status: result.status,
            lastRun: result.completedAt || result.startedAt,
            runCount: (existing?.runCount || 0) + 1,
          });
        }
      }
    }

    return Array.from(caseMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [data]);

  // Get unique suites for filter
  const suites = useMemo(
    () => [...new Set(testCases.map((tc: TestCaseData) => tc.suite))].sort(),
    [testCases]
  );

  // Filtered test cases
  const filtered = useMemo(() => {
    return testCases.filter((tc: TestCaseData) => {
      const matchesSearch =
        !search ||
        tc.name.toLowerCase().includes(search.toLowerCase()) ||
        tc.suite.toLowerCase().includes(search.toLowerCase());
      const matchesSuite = !suiteFilter || tc.suite === suiteFilter;
      const matchesStatus = !statusFilter || tc.status === statusFilter;
      return matchesSearch && matchesSuite && matchesStatus;
    });
  }, [testCases, search, suiteFilter, statusFilter]);

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading test cases...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search tests..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 flex-1 min-w-[200px] rounded-md border border-input bg-background px-3 text-sm"
        />
        <select
          value={suiteFilter}
          onChange={(e) => setSuiteFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Suites</option>
          {suites.map((s: string) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} test case{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
          {testCases.length === 0
            ? "No test cases discovered yet. Run some tests first."
            : "No tests match your filters."}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Test Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Suite
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                  Runs
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tc: TestCaseData) => (
                <tr
                  key={`${tc.suite}::${tc.name}`}
                  className="border-b hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(tc.status)}`}
                    >
                      {getStatusIcon(tc.status)} {tc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{tc.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tc.suite}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {tc.runCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
