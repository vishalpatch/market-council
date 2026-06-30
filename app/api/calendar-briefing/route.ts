import { NextResponse } from "next/server";
import { buildBriefing } from "@/lib/briefing";

export const runtime = "nodejs";
export const maxDuration = 60;

// Plumbing for AI pre-earnings briefings. The UI button is disabled until
// Anthropic credits are available; this route follows the committee/sentiment
// pattern and will work once a funded ANTHROPIC_API_KEY is configured.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const symbol = body?.symbol;

    if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
      return NextResponse.json(
        { error: "A ticker symbol is required." },
        { status: 400 }
      );
    }

    const briefing = await buildBriefing({
      symbol: symbol.trim().toUpperCase(),
      companyName:
        typeof body?.companyName === "string" ? body.companyName : symbol,
      date: typeof body?.date === "string" ? body.date : "",
      epsEstimate: typeof body?.epsEstimate === "number" ? body.epsEstimate : null,
    });

    return NextResponse.json({ briefing });
  } catch (err) {
    console.error("[calendar-briefing] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Briefing could not be generated: ${message}` },
      { status: 500 }
    );
  }
}
