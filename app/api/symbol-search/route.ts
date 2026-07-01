import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/finnhub";
import { getSessionUser } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const q = sanitizeText(new URL(req.url).searchParams.get("q"), 50);
    if (q.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const all = await searchSymbols(q);
    // Prefer clean US-listed symbols (no exchange suffix like ".SS"), up to 8.
    const results = all
      .filter((m) => /^[A-Z.-]{1,6}$/.test(m.symbol) && !m.symbol.includes("."))
      .slice(0, 8)
      .map((m) => ({ symbol: m.symbol, description: m.description }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[symbol-search] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
