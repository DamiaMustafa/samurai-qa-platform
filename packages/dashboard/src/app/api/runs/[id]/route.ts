import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/runs/[id] — get a specific run with results
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const run = await prisma.testRun.findUnique({
      where: { id },
      include: {
        results: {
          orderBy: { startedAt: "asc" },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    // Parse JSON fields from string columns
    const results = run.results.map((r) => ({
      ...r,
      steps: JSON.parse(r.steps || "[]"),
      errors: JSON.parse(r.errors || "[]"),
      screenshots: JSON.parse(r.screenshots || "[]"),
    }));

    return NextResponse.json({ ...run, results });
  } catch (error) {
    console.error("[GET /api/runs/:id]", error);
    return NextResponse.json(
      { error: "Failed to fetch run" },
      { status: 500 }
    );
  }
}

// PATCH /api/runs/[id] — update run status/stats
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const run = await prisma.testRun.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status as string }),
        ...(body.totalTests !== undefined && { totalTests: body.totalTests as number }),
        ...(body.passed !== undefined && { passed: body.passed as number }),
        ...(body.failed !== undefined && { failed: body.failed as number }),
        ...(body.skipped !== undefined && { skipped: body.skipped as number }),
        ...(body.duration !== undefined && { duration: body.duration as number }),
        ...(body.completedAt !== undefined && {
          completedAt: new Date(body.completedAt as string),
        }),
      },
    });

    return NextResponse.json(run);
  } catch (error) {
    // Handle record not found
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    console.error("[PATCH /api/runs/:id]", error);
    return NextResponse.json(
      { error: "Failed to update run" },
      { status: 500 }
    );
  }
}

// DELETE /api/runs/[id] — delete a run and its results
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.testRun.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to delete does not exist")
    ) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    console.error("[DELETE /api/runs/:id]", error);
    return NextResponse.json(
      { error: "Failed to delete run" },
      { status: 500 }
    );
  }
}
