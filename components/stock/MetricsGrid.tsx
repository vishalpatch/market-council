"use client";

import { useMemo } from "react";
import { getMockStats } from "@/lib/mockChart";
import { formatPrice, formatMarketCap, formatVolume } from "@/lib/format";

interface Quote {
  price: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
}

export default function MetricsGrid({
  symbol,
  quote,
  marketCap,
  currency,
}: {
  symbol: string;
  quote: Quote;
  marketCap: number;
  currency: string;
}) {
  const positive = quote.change >= 0;
  const accent = positive ? "#c8a45d" : "#cb7e68";

  const stats = useMemo(
    () => getMockStats(symbol, quote.price),
    [symbol, quote.price]
  );

  const metrics = [
    { label: "Change", value: `${positive ? "+" : ""}${formatPrice(quote.change, currency)}`, accent: true },
    { label: "Change %", value: `${positive ? "+" : ""}${quote.percentChange.toFixed(2)}%`, accent: true },
    { label: "Day High", value: formatPrice(quote.high, currency) },
    { label: "Day Low", value: formatPrice(quote.low, currency) },
    { label: "Volume", value: formatVolume(stats.volume) },
    { label: "Market Cap", value: formatMarketCap(marketCap, currency) },
    { label: "52W High", value: formatPrice(stats.high52, currency) },
    { label: "52W Low", value: formatPrice(stats.low52, currency) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* Featured current price */}
      <div className="col-span-2 rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5 backdrop-blur-xl">
        <p className="mb-1 text-xs uppercase tracking-wider text-muted">
          Current Price
        </p>
        <p
          className="font-mono text-4xl font-bold tabular-nums"
          style={{ color: accent }}
        >
          {formatPrice(quote.price, currency)}
        </p>
        <p className="mt-1 text-sm font-medium tabular-nums" style={{ color: accent }}>
          {positive ? "▲" : "▼"} {formatPrice(Math.abs(quote.change), currency)} (
          {Math.abs(quote.percentChange).toFixed(2)}%)
        </p>
      </div>

      {metrics.map((m) => (
        <div
          key={m.label}
          className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-4 backdrop-blur-xl transition-colors hover:border-[var(--edge-2)]"
        >
          <p className="mb-1.5 text-xs uppercase tracking-wider text-muted">
            {m.label}
          </p>
          <p
            className="font-mono text-lg font-semibold tabular-nums"
            style={m.accent ? { color: accent } : { color: "#fafafa" }}
          >
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}
