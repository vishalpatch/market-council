import { NextResponse } from "next/server";
import { buildRebuttal, judgeDebate, type DebateTurn } from "@/lib/devils-advocate";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ticker = typeof body?.ticker === "string" ? body.ticker.toUpperCase() : "";
    const mode = body?.mode;
    const thread = body?.thread as DebateTurn[] | undefined;

    if (!Array.isArray(thread) || thread.length === 0) {
      return NextResponse.json({ error: "A thesis is required to begin." }, { status: 400 });
    }

    if (mode === "referee") {
      const verdict = await judgeDebate(ticker, thread);
      return NextResponse.json({ verdict });
    }

    const text = await buildRebuttal(ticker, thread);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[devils-advocate] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `The Devil's Advocate is unavailable: ${message}` },
      { status: 500 }
    );
  }
}
