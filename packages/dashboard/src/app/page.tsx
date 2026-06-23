import { StatsCards } from "@/components/dashboard/StatsCards";
import { PassFailChart } from "@/components/dashboard/PassFailChart";
import { RecentRuns } from "@/components/dashboard/RecentRuns";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { TriggerRunButton } from "@/components/dashboard/TriggerRunButton";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Samurai Central Staging — Test Overview
          </p>
        </div>
        <TriggerRunButton />
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <PassFailChart />
        <TrendChart />
      </div>

      <RecentRuns />
    </div>
  );
}
