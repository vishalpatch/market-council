"use client";

import { useState } from "react";
import Image from "next/image";

interface Quote {
  price: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  prevClose: number;
}

interface CompanyProfile {
  name: string;
  ticker: string;
  logo: string;
  industry: string;
  marketCap: number;
  exchange: string;
  currency: string;
  weburl: string;
}

interface NewsItem {
  headline: string;
  url: string;
  datetime: number;
  source: string;
}

interface StockData {
  quote: Quote;
  profile: CompanyProfile;
  news: NewsItem[];
}

function formatMarketCap(mc: number, currency: string): string {
  if (mc >= 1_000_000) return `${currency} ${(mc / 1_000_000).toFixed(2)}T`;
  if (mc >= 1_000) return `${currency} ${(mc / 1_000).toFixed(2)}B`;
  return `${currency} ${mc.toFixed(0)}M`;
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function StockSearch() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<StockData | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const symbol = input.trim().toUpperCase();
    if (!symbol) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(`/api/stock/${symbol}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to fetch stock data.");
        return;
      }

      setData(json);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const positive = data && data.quote.change >= 0;

  return (
    <div>
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Enter a ticker — AAPL, NVDA, TSLA…"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-50 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-sm font-mono tracking-wide"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? "Fetching…" : "Look Up"}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-5 py-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-zinc-800 rounded" />
              <div className="h-3 w-20 bg-zinc-800 rounded" />
            </div>
          </div>
          <div className="h-8 w-32 bg-zinc-800 rounded" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-zinc-800 rounded" />
            <div className="h-3 w-5/6 bg-zinc-800 rounded" />
            <div className="h-3 w-4/6 bg-zinc-800 rounded" />
          </div>
        </div>
      )}

      {/* Stock card */}
      {data && !loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {data.profile.logo && (
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                    <Image
                      src={data.profile.logo}
                      alt={data.profile.name}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-zinc-50 leading-tight">
                    {data.profile.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {data.profile.ticker} · {data.profile.exchange} · {data.profile.industry}
                  </p>
                </div>
              </div>

              {/* Price block */}
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums">
                  {data.profile.currency} {data.quote.price.toFixed(2)}
                </p>
                <p
                  className={`text-sm font-medium tabular-nums mt-0.5 ${
                    positive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {positive ? "▲" : "▼"}{" "}
                  {Math.abs(data.quote.change).toFixed(2)}{" "}
                  ({Math.abs(data.quote.percentChange).toFixed(2)}%)
                </p>
              </div>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-zinc-800">
              {[
                { label: "Market Cap", value: formatMarketCap(data.profile.marketCap, data.profile.currency) },
                { label: "Day High", value: `${data.profile.currency} ${data.quote.high.toFixed(2)}` },
                { label: "Day Low", value: `${data.profile.currency} ${data.quote.low.toFixed(2)}` },
                { label: "Prev Close", value: `${data.profile.currency} ${data.quote.prevClose.toFixed(2)}` },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-zinc-500 mb-0.5">{s.label}</p>
                  <p className="text-sm font-medium tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* News */}
          {data.news.length > 0 && (
            <div className="p-6">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                Latest News
              </p>
              <ul className="space-y-4">
                {data.news.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-zinc-700 font-mono text-xs mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-200 hover:text-emerald-400 transition-colors leading-snug"
                      >
                        {item.headline}
                      </a>
                      <p className="text-xs text-zinc-500 mt-1">
                        {item.source} · {formatDate(item.datetime)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.news.length === 0 && (
            <div className="px-6 pb-6 pt-2 text-sm text-zinc-500">
              No news in the last 7 days.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
