"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import { formatPrice, formatRelativeDate } from "@/lib/format";

interface IndexCard {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  percentChange: number | null;
}

interface Headline {
  headline: string;
  url: string;
  source: string;
  datetime: number;
}

interface FeedItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  newsCount24h: number;
  headlines: Headline[];
  near: "high" | "low" | null;
  score: number;
  flags: string[];
}

interface TopStory {
  headline: string;
  url: string;
  source: string;
  datetime: number;
  image: string;
}

interface ApiResp {
  indices: IndexCard[];
  topStories: TopStory[];
  feed: FeedItem[];
  watchlistCount: number;
  error?: string;
}

const FLAG_META: Record<string, { label: string; color: string }> = {
  mover: { label: "Big mover", color: "#c8a45d" },
  news: { label: "News spike", color: "#d9bd83" },
  "near-high": { label: "Near 52W high", color: "#7ba890" },
  "near-low": { label: "Near 52W low", color: "#cb7e68" },
};

function changeColor(n: number | null) {
  if (n == null) return "#9b9486";
  return n >= 0 ? "#7ba890" : "#cb7e68";
}
function pct(n: number | null) {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export default function DigestClient() {
  const [data, setData] = useState<ApiResp | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/digest");
        const json = (await res.json()) as ApiResp;
        if (!res.ok) {
          setError(json.error ?? "Failed to load the digest.");
          return;
        }
        setData(json);
      } catch {
        setError("Network error. Please try again.");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10 px-5 py-4 text-sm text-[#cb7e68]">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Market overview */}
      <section>
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-faint">
          Market Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {data.indices.map((idx) => (
            <div
              key={idx.symbol}
              className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5 backdrop-blur-xl"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-lg font-light text-paper">{idx.name}</span>
                <span className="font-mono text-xs text-faint">{idx.symbol}</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-light text-paper">
                  {idx.price != null ? formatPrice(idx.price) : "—"}
                </span>
                <span className="font-mono text-sm" style={{ color: changeColor(idx.percentChange) }}>
                  {pct(idx.percentChange)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top stories — market-wide */}
      {data.topStories.length > 0 && (
        <section>
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-faint">
            Top Stories
          </h2>
          <div className="space-y-3">
            {data.topStories.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-4 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-gold/40"
              >
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image}
                    alt=""
                    className="hidden h-16 w-24 shrink-0 rounded-lg object-cover sm:block"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs text-faint">
                    <span className="font-medium text-gold">{s.source}</span>
                    <span>·</span>
                    <span>{formatRelativeDate(s.datetime)}</span>
                  </div>
                  <h3 className="font-medium leading-snug text-paper transition-colors group-hover:text-gold">
                    {s.headline}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Prioritized watchlist feed */}
      <section>
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-faint">
          Your Watchlist
        </h2>

        {data.watchlistCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--edge-2)] bg-[var(--surface)] p-12 text-center">
            <h3 className="mb-3 font-serif text-2xl font-light">Your briefing is empty</h3>
            <p className="mx-auto mb-8 max-w-sm text-pretty leading-relaxed text-muted">
              Add tickers to your watchlist and each morning this page ranks them by
              what needs your attention — big moves, news spikes, and 52-week extremes.
            </p>
            <Link
              href="/dashboard#watchlist"
              className="inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft"
            >
              Build your watchlist
            </Link>
          </div>
        ) : data.feed.length === 0 ? (
          <p className="text-sm text-muted">
            Quiet morning — no notable moves or news across your watchlist.
          </p>
        ) : (
          <div className="space-y-4">
            {data.feed.map((item) => (
              <FeedRow key={item.symbol} item={item} />
            ))}
          </div>
        )}
      </section>

      <p className="text-[11px] text-faint">
        Prices and news via Finnhub. For informational purposes only — not financial advice.
      </p>
    </div>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  return (
    <div className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-base font-bold text-paper">{item.symbol}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-muted">{item.name}</span>
        <span className="font-mono text-sm text-paper">{formatPrice(item.price)}</span>
        <span className="w-20 text-right font-mono text-sm" style={{ color: changeColor(item.percentChange) }}>
          {pct(item.percentChange)}
        </span>
      </div>

      {/* Why flagged */}
      {item.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.flags.map((f) => {
            const meta = FLAG_META[f];
            if (!meta) return null;
            return (
              <span
                key={f}
                className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  color: meta.color,
                  borderColor: `${meta.color}66`,
                  backgroundColor: `${meta.color}1a`,
                }}
              >
                {meta.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Headlines */}
      {item.headlines.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-[var(--edge)] pt-3">
          {item.headlines.map((h, i) => (
            <a
              key={i}
              href={h.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-2 text-sm"
            >
              <span className="mt-0.5 text-faint">·</span>
              <span className="min-w-0 flex-1 truncate text-muted transition-colors group-hover:text-[#c8a45d]">
                {h.headline}
              </span>
              <span className="shrink-0 text-[11px] text-faint">
                {formatRelativeDate(h.datetime)}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
