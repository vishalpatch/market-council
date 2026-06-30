"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";

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

interface ApiResp {
  from: string;
  to: string;
  catalysts: Catalyst[];
  watchlist: string[];
  economicAvailable: boolean;
  error?: string;
}

type TypeFilter = "all" | "earnings" | "ipo";

const HOUR_LABEL: Record<string, string> = {
  bmo: "Before open",
  amc: "After close",
  dmh: "During hours",
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const PRESETS = [
  { key: "this-week", label: "This week", days: [0, 6] },
  { key: "next-week", label: "Next week", days: [7, 13] },
  { key: "this-month", label: "Next 30 days", days: [0, 30] },
] as const;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "earnings", label: "Earnings" },
  { key: "ipo", label: "IPO" },
];

function rangeFor(days: readonly [number, number] | number[]) {
  const today = new Date();
  const from = new Date(today.getTime() + days[0] * 86400000);
  const to = new Date(today.getTime() + days[1] * 86400000);
  return { from: iso(from), to: iso(to) };
}

function formatDay(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatRevenue(n: number | null) {
  if (n == null) return null;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function CalendarClient({ userId }: { userId: string }) {
  const [preset, setPreset] = useState<string>("this-week");
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<Set<string>>(new Set());

  // Client-side filters (operate on already-loaded data — no API calls)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [query, setQuery] = useState("");

  const supabase = createClient();

  const load = useCallback(async (presetKey: string) => {
    const p = PRESETS.find((x) => x.key === presetKey) ?? PRESETS[0];
    const { from, to } = rangeFor(p.days);
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
      const json = (await res.json()) as ApiResp;
      if (!res.ok) {
        setError(json.error ?? "Failed to load the calendar.");
        return;
      }
      setData(json);
      setWatchlist((prev) => {
        const next = new Set(prev);
        json.watchlist.forEach((t) => next.add(t));
        return next;
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(preset);
  }, [preset, load]);

  async function toggleWatch(symbol: string) {
    if (busy.has(symbol)) return;
    setBusy((prev) => new Set(prev).add(symbol));
    const watching = watchlist.has(symbol);

    if (watching) {
      const { error: delErr } = await supabase
        .from("watchlist_items")
        .delete()
        .eq("user_id", userId)
        .eq("ticker", symbol);
      if (!delErr) {
        setWatchlist((prev) => {
          const n = new Set(prev);
          n.delete(symbol);
          return n;
        });
      }
    } else {
      const { error: insErr } = await supabase
        .from("watchlist_items")
        .insert({ user_id: userId, ticker: symbol });
      // 23505 = already present → treat as success.
      if (!insErr || insErr.code === "23505") {
        setWatchlist((prev) => new Set(prev).add(symbol));
      }
    }

    setBusy((prev) => {
      const n = new Set(prev);
      n.delete(symbol);
      return n;
    });
  }

  // Apply type + search filters, then group by date.
  const groups = useMemo<[string, Catalyst[]][]>(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const filtered = data.catalysts.filter((c) => {
      if (typeFilter !== "all" && c.kind !== typeFilter) return false;
      if (!q) return true;
      if (c.symbol.toLowerCase().includes(q)) return true;
      if (c.kind === "ipo" && c.name.toLowerCase().includes(q)) return true;
      return false;
    });
    const map = new Map<string, Catalyst[]>();
    for (const c of filtered) {
      const arr = map.get(c.date);
      if (arr) arr.push(c);
      else map.set(c.date, [c]);
    }
    return Array.from(map.entries());
  }, [data, typeFilter, query]);

  const filtersActive = typeFilter !== "all" || query.trim().length > 0;

  return (
    <div>
      {/* Date range controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              preset === p.key
                ? "border-gold/50 bg-gold/[0.12] text-gold"
                : "border-hairline text-muted hover:border-hairline-strong hover:text-paper"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Type filter + search */}
      <div className="mb-12 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                typeFilter === t.key
                  ? "border-gold/50 bg-gold/[0.12] text-gold"
                  : "border-hairline text-muted hover:border-hairline-strong hover:text-paper"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or ticker…"
            className="w-full rounded-full border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] px-4 py-1.5 text-sm text-paper placeholder-faint transition-colors focus:border-gold/50 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-paper"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10 px-5 py-4 text-sm text-[#cb7e68]">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !error && data && groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#ece6d9]/[0.14] bg-[#ece6d9]/[0.02] p-12 text-center">
          <h2 className="mb-3 font-serif text-2xl font-light">
            {filtersActive ? "No matches" : "Nothing major in this window"}
          </h2>
          <p className="mx-auto max-w-sm text-pretty leading-relaxed text-muted">
            {filtersActive
              ? "No catalysts match your current filters. Try clearing the search or switching the type."
              : "No analyst-covered earnings or IPOs are scheduled for this range. Try a wider window."}
          </p>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="space-y-12">
          {groups.map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-5 border-b border-hairline pb-3 font-serif text-xl font-light tracking-editorial">
                {formatDay(date)}
              </h2>
              <div className="space-y-3">
                {items.map((c, i) => (
                  <CatalystRow
                    key={`${c.symbol}-${i}`}
                    catalyst={c}
                    watching={watchlist.has(c.symbol)}
                    busy={busy.has(c.symbol)}
                    onToggle={() => toggleWatch(c.symbol)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Economic-calendar note (free tier doesn't expose it) */}
      {data && !data.economicAvailable && (
        <p className="mt-12 border-t border-hairline pt-6 text-[11px] text-faint">
          Economic-calendar catalysts (Fed meetings, CPI, and other macro releases)
          require a paid Finnhub tier and aren&apos;t shown here.
        </p>
      )}
    </div>
  );
}

function TypeTag({ kind }: { kind: Catalyst["kind"] }) {
  if (kind === "ipo") {
    return (
      <span className="rounded-full border border-[#7ba890]/40 bg-[#7ba890]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7ba890]">
        IPO
      </span>
    );
  }
  return (
    <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
      Earnings
    </span>
  );
}

function CatalystRow({
  catalyst,
  watching,
  busy,
  onToggle,
}: {
  catalyst: Catalyst;
  watching: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] p-5 backdrop-blur-xl">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <TypeTag kind={catalyst.kind} />
          {catalyst.kind === "ipo" ? (
            <h3 className="truncate font-serif text-lg font-light text-paper">
              {catalyst.name || catalyst.symbol}
            </h3>
          ) : (
            <span className="font-mono text-base font-bold text-paper">
              {catalyst.symbol}
            </span>
          )}
          <span className="rounded-md bg-[#ece6d9]/[0.06] px-2 py-0.5 font-mono text-xs text-muted">
            {catalyst.symbol}
          </span>
          {catalyst.kind === "earnings" && watching && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gold">
              <span className="text-[0.85em]">★</span> Watching
            </span>
          )}
        </div>

        <p className="text-xs text-faint">
          {catalyst.kind === "earnings" ? (
            <>
              {HOUR_LABEL[catalyst.hour] ?? "Time TBD"}
              {catalyst.epsEstimate != null && (
                <> · Est. EPS {catalyst.epsEstimate.toFixed(2)}</>
              )}
              {catalyst.revenueEstimate != null && (
                <> · Est. rev {formatRevenue(catalyst.revenueEstimate)}</>
              )}
            </>
          ) : (
            <>
              {catalyst.exchange}
              {catalyst.price && <> · {catalyst.price}</>}
              {catalyst.status && <> · {catalyst.status}</>}
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Watchlist toggle (earnings tickers) */}
        {catalyst.kind === "earnings" && (
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            title={watching ? "Remove from watchlist" : "Add to watchlist"}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-40 ${
              watching
                ? "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20"
                : "border-hairline text-muted hover:border-gold hover:text-gold"
            }`}
          >
            {busy ? <Spinner size="sm" /> : watching ? "★" : "+"}
          </button>
        )}

        {/* AI Briefing — disabled until Anthropic credits are available */}
        {catalyst.kind === "earnings" && (
          <button
            type="button"
            disabled
            title="Requires Anthropic API credits"
            className="cursor-not-allowed rounded-full border border-hairline px-4 py-1.5 text-xs font-medium text-faint opacity-60"
          >
            AI Briefing
          </button>
        )}
      </div>
    </div>
  );
}
