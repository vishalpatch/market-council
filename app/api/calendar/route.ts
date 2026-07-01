import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEarningsCalendarRange, getIpoCalendar } from "@/lib/finnhub";

export const runtime = "nodejs";
export const maxDuration = 60;

const DAY = 86400000;
const MAX_RANGE_DAYS = 31;
const MAX_EARNINGS = 200;

type Catalyst =
  | {
      kind: "earnings";
      symbol: string;
      date: string;
      hour: string;
      epsEstimate: number | null;
      revenueEstimate: number | null;
    }
  | {
      kind: "ipo";
      symbol: string;
      name: string;
      date: string;
      exchange: string;
      price: string;
      status: string;
    };

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const url = new URL(req.url);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Only accept strict YYYY-MM-DD; anything else falls back to a safe default,
    // so nothing user-controlled is interpolated into the Finnhub URL.
    const isoDate = (v: string | null, fallback: string) =>
      v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : fallback;

    let from = isoDate(url.searchParams.get("from"), todayStr);
    let to = isoDate(
      url.searchParams.get("to"),
      new Date(today.getTime() + 7 * DAY).toISOString().slice(0, 10)
    );
    if (from > to) [from, to] = [to, from];
    // Bound the range so a single request can't pull an unbounded window.
    const maxTo = new Date(new Date(`${from}T00:00:00`).getTime() + MAX_RANGE_DAYS * DAY)
      .toISOString()
      .slice(0, 10);
    if (to > maxTo) to = maxTo;

    // Watchlist (for highlighting) — one cheap query.
    const { data: wl } = await supabase.from("watchlist_items").select("ticker");
    const watchlist = Array.from(
      new Set((wl ?? []).map((w) => (w.ticker as string).toUpperCase()))
    );

    // Two Finnhub calls total, both cached (revalidate 1h). Settle independently
    // so one failing endpoint doesn't take down the other.
    const [earningsRes, iposRes] = await Promise.allSettled([
      getEarningsCalendarRange(from, to),
      getIpoCalendar(from, to),
    ]);

    const catalysts: Catalyst[] = [];

    if (earningsRes.status === "fulfilled") {
      const meaningful = earningsRes.value
        // Analyst-covered names (with EPS or revenue estimates) = the major companies.
        .filter((e) => e.epsEstimate != null || e.revenueEstimate != null)
        .sort(
          (a, b) =>
            a.date.localeCompare(b.date) ||
            (b.revenueEstimate ?? 0) - (a.revenueEstimate ?? 0)
        )
        .slice(0, MAX_EARNINGS);
      for (const e of meaningful) {
        catalysts.push({
          kind: "earnings",
          symbol: e.symbol,
          date: e.date,
          hour: e.hour,
          epsEstimate: e.epsEstimate,
          revenueEstimate: e.revenueEstimate,
        });
      }
    }

    if (iposRes.status === "fulfilled") {
      for (const ipo of iposRes.value) {
        catalysts.push({
          kind: "ipo",
          symbol: ipo.symbol,
          name: ipo.name,
          date: ipo.date,
          exchange: ipo.exchange,
          price: ipo.price,
          status: ipo.status,
        });
      }
    }

    catalysts.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      from,
      to,
      catalysts,
      watchlist,
      // Economic calendar (Fed/CPI/etc.) is not available on the Finnhub free tier.
      economicAvailable: false,
    });
  } catch (err) {
    console.error("[calendar] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
