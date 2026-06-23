import { RunsList } from "@/components/runs/RunsList";
import { TriggerRunButton } from "@/components/dashboard/TriggerRunButton";

export default function RunsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Runs</h1>
          <p className="text-muted-foreground">
            View all test execution history
          </p>
        </div>
        <TriggerRunButton />
      </div>

      <RunsList />
    </div>
  );
}
