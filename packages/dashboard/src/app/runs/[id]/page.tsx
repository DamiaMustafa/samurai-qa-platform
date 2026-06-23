import { RunDetail } from "@/components/runs/RunDetail";

interface RunDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Run Detail</h1>
        <p className="text-muted-foreground">Run ID: {id}</p>
      </div>

      <RunDetail runId={id} />
    </div>
  );
}
