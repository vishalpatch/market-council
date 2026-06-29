"use client";

import { useState } from "react";
import Image from "next/image";
import PriceChart from "./stock/PriceChart";
import MetricsGrid from "./stock/MetricsGrid";
import NewsFeed, { type NewsItem } from "./stock/NewsFeed";

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

interface StockData {
  quote: Quote;
  profile: CompanyProfile;
  news: NewsItem[];
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

  const positive = data ? data.quote.change >= 0 : true;
  const currency = data?.profile.currency ?? "USD";

  return (
    <div>
      {/* Prominent search bar */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            width="18"
            height="18"
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
            placeholder="Search any ticker — AAPL, NVDA, TSLA, MSFT…"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-4 pl-11 pr-4 font-mono text-sm tracking-wide text-zinc-50 placeholder-zinc-600 backdrop-blur-xl transition-all focus:border-[#00dc82]/50 focus:outline-none focus:ring-1 focus:ring-[#00dc82]/50"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-[#00dc82] px-6 py-4 text-sm font-semibold text-black transition-all hover:bg-[#00dc82]/90 hover:shadow-[0_0_24px_-4px_#00dc82] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Loading…" : "Analyze"}
        </button>
      </form>

      {error && (
        <div className="rounded-2xl border border-[#ff5470]/30 bg-[#ff5470]/10 px-5 py-4 text-sm text-[#ff5470]">
          {error}
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {data && !loading && (
        <div className="space-y-6">
          {/* Company header */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl">
            {data.profile.logo && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                <Image
                  src={data.profile.logo}
                  alt={data.profile.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-zinc-50">
                  {data.profile.name}
                </h3>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-zinc-400">
                  {data.profile.ticker}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">
                {data.profile.exchange} · {data.profile.industry}
              </p>
            </div>
          </div>

          {/* Key metrics */}
          <MetricsGrid
            symbol={data.profile.ticker}
            quote={data.quote}
            marketCap={data.profile.marketCap}
            currency={currency}
          />

          {/* Price chart */}
          <PriceChart
            symbol={data.profile.ticker}
            currentPrice={data.quote.price}
            positive={positive}
            currency={currency}
          />

          {/* News */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Latest News
            </h3>
            <NewsFeed news={data.news} />
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="h-12 w-12 rounded-xl bg-white/[0.06]" />
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-white/[0.06]" />
          <div className="h-3 w-32 rounded bg-white/[0.06]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 h-28 rounded-2xl border border-white/[0.08] bg-white/[0.02]" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl border border-white/[0.08] bg-white/[0.02]" />
        ))}
      </div>
      <div className="h-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.02]" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-white/[0.08] bg-white/[0.02]" />
        ))}
      </div>
    </div>
  );
}
