import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TestResult } from "@samurai-qa/shared";

// POST /api/results — bulk insert test results from reporter
export async function POST(request: NextRequest) {
  try {
    const results: TestResult[] = await request.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "Expected an array of test results" },
        { status: 400 }
      );
    }

    const created = await prisma.testResult.createMany({
      data: results.map((r) => ({
        runId: r.runId,
        suiteName: r.suiteName,
        testName: r.testName,
        status: r.status,
        duration: r.duration,
        retries: r.retries,
        errors: JSON.stringify(r.errors || []),
        screenshots: JSON.stringify(r.screenshots || []),
        videoPath: r.videoPath || null,
        logPath: r.logPath || null,
        steps: JSON.stringify(r.steps || []),
        startedAt: new Date(r.startedAt),
        completedAt: new Date(r.completedAt),
      })),
    });

    return NextResponse.json(
      { inserted: created.count },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/results]", error);
    return NextResponse.json(
      { error: "Failed to insert results" },
      { status: 500 }
    );
  }
}
