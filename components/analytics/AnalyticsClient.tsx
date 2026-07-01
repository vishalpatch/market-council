"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";

const GOLD = "#c8a45d";
const UP = "#7ba890";
const DOWN = "#cb7e68";
const MUTED = "#9b9486";
const FAINT = "#6c665b";
const GRID = "rgba(236,230,217,0.07)";

type Status = "Watching" | "Entered" | "Exited";
type Outcome = "win" | "loss" | "neutral" | null;

interface Entry {
  id: string;
  ticker: string;
  status: Status;
  outcome: Outcome;
  created_at: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-lg border border-[var(--edge)] bg-black/80 px-3 py-2 text-xs backdrop-blur-xl">
      <p className="mb-0.5 text-muted">{label}</p>
      <p className="font-mono font-semibold text-[#c8a45d]">
        {v} {v === 1 ? "entry" : "entries"}
      </p>
    </div>
  );
}

export default function AnalyticsClient() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("id, ticker, status, outcome, created_at")
        .order("created_at", { ascending: true });
      setEntries((data as Entry[]) ?? []);
    })();
  }, [supabase]);

  const stats = useMemo(() => {
    if (!entries) return null;
    const statusCounts = { Watching: 0, Entered: 0, Exited: 0 };
    const monthMap = new Map<string, number>();
    const tickerMap = new Map<string, number>();
    let wins = 0;
    let losses = 0;
    let neutral = 0;

    for (const e of entries) {
      statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1;

      const d = new Date(e.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);

      tickerMap.set(e.ticker, (tickerMap.get(e.ticker) ?? 0) + 1);

      if (e.status === "Exited") {
        if (e.outcome === "win") wins++;
        else if (e.outcome === "loss") losses++;
        else neutral++;
      }
    }

    const monthly = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([key, count]) => {
        const [y, m] = key.split("-");
        const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
          month: "short",
        });
        return { label, count };
      });

    const tickers = Array.from(tickerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ticker, count]) => ({ ticker, count }));

    const decided = wins + losses;
    const winRate = decided > 0 ? Math.round((wins / decided) * 100) : null;

    return {
      total: entries.length,
      statusCounts,
      monthly,
      tickers,
      wins,
      losses,
      neutral,
      decided,
      winRate,
      totalExited: statusCounts.Exited,
    };
  }, [entries]);

  if (!stats) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--edge-2)] bg-[var(--surface)] p-12 text-center">
        <h2 className="mb-3 font-serif text-2xl font-light">No data to analyze yet</h2>
        <p className="mx-auto mb-8 max-w-sm text-pretty leading-relaxed text-muted">
          Your analytics are built from your trade journal. Log a few investment
          ideas — and tag the ones you exit as wins or losses — to see your
          conviction patterns and win rate here.
        </p>
        <Link
          href="/dashboard/journal"
          className="inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft"
        >
          Open the Journal
        </Link>
      </div>
    );
  }

  const statusTiles = [
    { label: "Total Entries", value: stats.total },
    { label: "Watching", value: stats.statusCounts.Watching },
    { label: "Entered", value: stats.statusCounts.Entered },
    { label: "Exited", value: stats.statusCounts.Exited },
  ];

  return (
    <div className="space-y-20">
      {/* Status totals */}
      <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
        {statusTiles.map((t) => (
          <div key={t.label} className="border-t border-hairline pt-6 sm:pr-8">
            <p className="text-xs uppercase tracking-[0.15em] text-faint">{t.label}</p>
            <p className="mt-2 font-serif text-4xl font-light">{t.value}</p>
          </div>
        ))}
      </div>

      {/* Activity over time */}
      <section>
        <div className="mb-8 flex items-baseline justify-between border-b border-hairline pb-4">
          <h2 className="font-serif text-2xl font-light tracking-editorial">
            Conviction over time
          </h2>
          <p className="text-xs uppercase tracking-[0.15em] text-faint">
            Entries logged per month
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthly} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: MUTED, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: FAINT, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip cursor={{ fill: "rgba(236,230,217,0.04)" }} content={<ChartTooltip />} />
              <Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Outcomes / win-loss */}
      <section>
        <div className="mb-8 flex items-baseline justify-between border-b border-hairline pb-4">
          <h2 className="font-serif text-2xl font-light tracking-editorial">Outcomes</h2>
          <p className="text-xs uppercase tracking-[0.15em] text-faint">
            Among exited positions
          </p>
        </div>

        {stats.totalExited === 0 ? (
          <p className="text-pretty leading-relaxed text-muted">
            You haven&apos;t exited any positions yet. When you mark a journal entry
            as <span className="text-paper">Exited</span>, tag it a win or loss to
            build your track record.
          </p>
        ) : (
          <div className="grid gap-10 md:grid-cols-[200px_1fr]">
            <div>
              <p className="font-serif text-6xl font-light text-gold">
                {stats.winRate === null ? "—" : `${stats.winRate}%`}
              </p>
              <p className="mt-2 text-sm text-muted">
                {stats.winRate === null
                  ? "Tag exited trades to see your win rate"
                  : `Win rate · ${stats.wins} of ${stats.decided} decided`}
              </p>
            </div>

            <div>
              <div className="grid grid-cols-3 gap-px">
                {[
                  { label: "Wins", value: stats.wins, color: UP },
                  { label: "Losses", value: stats.losses, color: DOWN },
                  { label: "Untagged", value: stats.neutral, color: MUTED },
                ].map((s) => (
                  <div key={s.label} className="border-t border-hairline pt-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-faint">
                      {s.label}
                    </p>
                    <p
                      className="mt-1 font-serif text-3xl font-light"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Proportion bar */}
              <div className="mt-8 flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                {[
                  { value: stats.wins, color: UP },
                  { value: stats.losses, color: DOWN },
                  { value: stats.neutral, color: "rgba(155,148,134,0.5)" },
                ].map((seg, i) =>
                  seg.value > 0 ? (
                    <div
                      key={i}
                      style={{
                        width: `${(seg.value / stats.totalExited) * 100}%`,
                        backgroundColor: seg.color,
                      }}
                    />
                  ) : null
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Most active tickers */}
      <section>
        <div className="mb-8 flex items-baseline justify-between border-b border-hairline pb-4">
          <h2 className="font-serif text-2xl font-light tracking-editorial">
            Where your conviction sits
          </h2>
          <p className="text-xs uppercase tracking-[0.15em] text-faint">
            Most-tracked tickers
          </p>
        </div>
        <div style={{ height: stats.tickers.length * 44 + 16 }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={stats.tickers}
              margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="ticker"
                width={64}
                tick={{ fill: MUTED, fontSize: 13, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={{ fill: "rgba(236,230,217,0.04)" }} content={<ChartTooltip />} />
              <Bar dataKey="count" fill={GOLD} radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <p className="text-[11px] text-faint">
        For informational purposes only — not financial advice.
      </p>
    </div>
  );
}
