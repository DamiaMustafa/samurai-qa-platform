import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/runs — list recent test runs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const [runs, total] = await Promise.all([
      prisma.testRun.findMany({
        orderBy: { startedAt: "desc" },
        take: limit,
        skip: offset,
        include: { _count: { select: { results: true } } },
      }),
      prisma.testRun.count(),
    ]);

    return NextResponse.json({ runs, total, limit, offset });
  } catch (error) {
    console.error("[GET /api/runs]", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

// POST /api/runs — create a new test run
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

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    const run = await prisma.testRun.create({
      data: {
        id: body.id,
        trigger: (body.trigger as string) || "manual",
        suite: (body.suite as string) || null,
        status: (body.status as string) || "running",
        totalTests: (body.totalTests as number) || 0,
        passed: (body.passed as number) || 0,
        failed: (body.failed as number) || 0,
        skipped: (body.skipped as number) || 0,
        duration: (body.duration as number) || 0,
        startedAt: body.startedAt
          ? new Date(body.startedAt as string)
          : new Date(),
      },
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error("[POST /api/runs]", error);
    const message =
      error instanceof Error ? error.message : "Failed to create run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
