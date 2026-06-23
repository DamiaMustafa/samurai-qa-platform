import { TestCaseBrowser } from "@/components/tests/TestCaseBrowser";

export default function TestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Cases</h1>
        <p className="text-muted-foreground">
          Browse and manage all discovered test cases
        </p>
      </div>

      <TestCaseBrowser />
    </div>
  );
}
