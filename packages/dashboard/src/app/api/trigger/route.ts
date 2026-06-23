import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { spawnTestRun } from "@/lib/test-runner";
import { v4 as uuidv4 } from "uuid";

// POST /api/trigger — trigger a new Playwright test run
export async function POST(request: NextRequest) {
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

    const suite = typeof body.suite === "string" ? body.suite : undefined;
    const trigger = typeof body.trigger === "string" ? body.trigger : "manual";

    if (suite && suite.length > 200) {
      return NextResponse.json(
        { error: "Suite filter must be under 200 characters" },
        { status: 400 }
      );
    }

    const runId = uuidv4();

    // Create the run record immediately
    const run = await prisma.testRun.create({
      data: {
        id: runId,
        trigger,
        suite: suite || null,
        status: "running",
        startedAt: new Date(),
      },
    });

    // Spawn Playwright in background
    spawnTestRun(runId, suite);

    return NextResponse.json(
      { runId: run.id, message: "Test run started" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/trigger]", error);
    const message =
      error instanceof Error ? error.message : "Failed to trigger test run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
