import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getQuote,
  getCompanyNews,
  getCompanyProfile,
  getBasicFinancials,
} from "@/lib/finnhub";

export const runtime = "nodejs";
export const maxDuration = 60;

const INDICES = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "Nasdaq 100" },
  { symbol: "DIA", name: "Dow Jones" },
];
const MAX_TICKERS = 12;
const DAY_SECONDS = 86400;

interface DigestItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  newsCount24h: number;
  headlines: { headline: string; url: string; source: string; datetime: number }[];
  near: "high" | "low" | null;
  score: number;
  flags: string[];
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const indices = await Promise.all(
      INDICES.map(async (i) => {
        try {
          const q = await getQuote(i.symbol);
          return {
            ...i,
            price: q.price,
            change: q.change,
            percentChange: q.percentChange,
          };
        } catch {
          return { ...i, price: null, change: null, percentChange: null };
        }
      })
    );

    const { data: wl } = await supabase
      .from("watchlist_items")
      .select("ticker")
      .order("added_at", { ascending: true });
    const tickers = Array.from(
      new Set((wl ?? []).map((w) => (w.ticker as string).toUpperCase()))
    ).slice(0, MAX_TICKERS);

    const nowSec = Math.floor(Date.now() / 1000);

    const items = await Promise.all(
      tickers.map(async (t): Promise<DigestItem | null> => {
        try {
          const [q, news, profile, fin] = await Promise.all([
            getQuote(t),
            getCompanyNews(t).catch(() => []),
            getCompanyProfile(t).catch(() => null),
            getBasicFinancials(t).catch(() => ({ high52: null, low52: null })),
          ]);

          const recent = news.filter((n) => nowSec - n.datetime <= DAY_SECONDS).length;
          const headlines = news.slice(0, 3).map((n) => ({
            headline: n.headline,
            url: n.url,
            source: n.source,
            datetime: n.datetime,
          }));

          let near: "high" | "low" | null = null;
          if (fin.high52 && q.price >= fin.high52 * 0.97) near = "high";
          else if (fin.low52 && q.price <= fin.low52 * 1.03) near = "low";

          const absMove = Math.abs(q.percentChange ?? 0);
          const score = absMove * 10 + recent * 6 + (near ? 15 : 0);

          const flags: string[] = [];
          if (absMove >= 3) flags.push("mover");
          if (recent >= 3) flags.push("news");
          if (near === "high") flags.push("near-high");
          if (near === "low") flags.push("near-low");

          return {
            symbol: t,
            name: profile?.name ?? t,
            price: q.price,
            change: q.change,
            percentChange: q.percentChange,
            newsCount24h: recent,
            headlines,
            near,
            score,
            flags,
          };
        } catch {
          return null;
        }
      })
    );

    const feed = items
      .filter((x): x is DigestItem => x !== null)
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({ indices, feed, watchlistCount: tickers.length });
  } catch (err) {
    console.error("[digest] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
