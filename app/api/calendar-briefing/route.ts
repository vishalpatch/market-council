import { NextResponse } from "next/server";
import { buildBriefing } from "@/lib/briefing";
import { getSessionUser } from "@/lib/auth";
import { sanitizeTicker, sanitizeText, sanitizeNumber } from "@/lib/sanitize";

export const runtime = "nodejs";
export const maxDuration = 60;

// Plumbing for AI pre-earnings briefings. The UI button is disabled until
// Anthropic credits are available; this follows the committee/sentiment pattern.
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    const symbol = sanitizeTicker(body?.symbol);

    if (!symbol) {
      return NextResponse.json({ error: "A ticker symbol is required." }, { status: 400 });
    }

    const briefing = await buildBriefing({
      symbol,
      companyName: sanitizeText(body?.companyName, 120) || symbol,
      date: sanitizeText(body?.date, 40),
      epsEstimate: sanitizeNumber(body?.epsEstimate, -1e6, 1e6),
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
