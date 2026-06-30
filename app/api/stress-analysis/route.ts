import { NextResponse } from "next/server";
import { buildStressAnalysis } from "@/lib/stress-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

// Plumbing for the AI risk assessment. The UI button is disabled until Anthropic
// credits are available; this follows the committee/sentiment pattern.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body?.holdings) || !Array.isArray(body?.crises)) {
      return NextResponse.json(
        { error: "A portfolio and stress-test results are required." },
        { status: 400 }
      );
    }

    const analysis = await buildStressAnalysis({
      holdings: body.holdings,
      crises: body.crises,
    });
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[stress-analysis] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis could not be generated: ${message}` },
      { status: 500 }
    );
  }
}
