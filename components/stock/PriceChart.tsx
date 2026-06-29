"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_TYPES,
  TIME_RANGES,
  generateSeries,
  type ChartType,
  type TimeRange,
} from "@/lib/mockChart";
import { formatPrice } from "@/lib/format";
import CandlestickChart from "./CandlestickChart";

const UP = "#00dc82";
const DOWN = "#ff5470";

interface TooltipProps {
  active?: boolean;
  payload?: { payload: { fullLabel: string; close: number } }[];
}

function ChartTooltip({ active, payload, currency }: TooltipProps & { currency: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/80 px-3 py-2 backdrop-blur-xl">
      <p className="mb-0.5 text-xs text-zinc-400">{p.fullLabel}</p>
      <p className="font-mono text-sm font-semibold text-zinc-100">
        {formatPrice(p.close, currency)}
      </p>
    </div>
  );
}

export default function PriceChart({
  symbol,
  currentPrice,
  positive,
  currency,
}: {
  symbol: string;
  currentPrice: number;
  positive: boolean;
  currency: string;
}) {
  const [type, setType] = useState<ChartType>("area");
  const [range, setRange] = useState<TimeRange>("3M");

  const data = useMemo(
    () => generateSeries(symbol, range, currentPrice),
    [symbol, range, currentPrice]
  );

  const stroke = positive ? UP : DOWN;
  const lows = data.map((d) => d.low);
  const highs = data.map((d) => d.high);
  const domain = [Math.min(...lows) * 0.99, Math.max(...highs) * 1.01];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl">
      {/* Toggles */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-black/30 p-1">
          {CHART_TYPES.map((c) => (
            <button
              key={c.key}
              onClick={() => setType(c.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                type === c.key
                  ? "bg-[#00dc82] text-black"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-black/30 p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                range === r
                  ? "bg-white/10 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[360px] w-full">
        {type === "candlestick" ? (
          <CandlestickChart data={data} currency={currency} />
        ) : type === "line" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                orientation="right"
                domain={domain}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => formatPrice(v, currency)}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Line
                type="monotone"
                dataKey="close"
                stroke={stroke}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: stroke }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                orientation="right"
                domain={domain}
                stroke="rgba(255,255,255,0.4)"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => formatPrice(v, currency)}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#areaFill)"
                activeDot={{ r: 4, fill: stroke }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-zinc-600">
        Chart data is simulated for demonstration · anchored to the live price
      </p>
    </div>
  );
}
