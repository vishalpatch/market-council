import { NextResponse } from "next/server";
import { buildStressAnalysis } from "@/lib/stress-analysis";
import { getSessionUser } from "@/lib/auth";
import { sanitizeTicker, sanitizeText, sanitizeNumber } from "@/lib/sanitize";

export const runtime = "nodejs";
export const maxDuration = 60;

// Plumbing for the AI risk assessment. The UI button is disabled until Anthropic
// credits are available; this follows the committee/sentiment pattern.
export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    if (!Array.isArray(body?.holdings) || !Array.isArray(body?.crises)) {
      return NextResponse.json(
        { error: "A portfolio and stress-test results are required." },
        { status: 400 }
      );
    }

    const holdings = body.holdings.slice(0, 50).map((h: unknown) => {
      const x = h as { ticker?: unknown; alloc?: unknown; sector?: unknown };
      return {
        ticker: sanitizeTicker(x?.ticker),
        alloc: sanitizeNumber(x?.alloc, 0, 100) ?? 0,
        sector: sanitizeText(x?.sector, 40),
      };
    });
    const crises = body.crises.slice(0, 10).map((c: unknown) => {
      const x = c as { name?: unknown; drawdownPct?: unknown; dollarLoss?: unknown };
      return {
        name: sanitizeText(x?.name, 80),
        drawdownPct: sanitizeNumber(x?.drawdownPct, -100, 100) ?? 0,
        dollarLoss: sanitizeNumber(x?.dollarLoss, 0, 1e12) ?? 0,
      };
    });

    const analysis = await buildStressAnalysis({ holdings, crises });
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
