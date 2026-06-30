"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import Spinner from "@/components/Spinner";
import {
  computeCrises,
  sectorBreakdown,
  sectorForIndustry,
  type CrisisResult,
  type HoldingResolved,
} from "@/lib/stress";

const GOLD = "#c8a45d";
const UP = "#7ba890";
const DOWN = "#cb7e68";
const MUTED = "#9b9486";
const FAINT = "#6c665b";
const GRID = "rgba(236,230,217,0.07)";
const SECTOR_COLORS = [
  "#c8a45d",
  "#7ba890",
  "#cb7e68",
  "#d9bd83",
  "#a8884a",
  "#8c5a2e",
  "#b8a06a",
  "#5e7d6f",
  "#9b9486",
  "#6c665b",
];

interface Row {
  ticker: string;
  alloc: string;
}

interface SavedPortfolio {
  id: string;
  name: string;
  holdings: { ticker: string; alloc: number }[];
  created_at: string;
}

interface Results {
  resolved: HoldingResolved[];
  crises: CrisisResult[];
  breakdown: { sector: string; label: string; weight: number }[];
}

const inputCls =
  "rounded-xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] px-4 py-2.5 text-sm text-paper placeholder-faint transition-colors focus:border-gold/50 focus:outline-none";

export default function StressTestClient({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Row[]>([
    { ticker: "", alloc: "" },
    { ticker: "", alloc: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Results | null>(null);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SavedPortfolio[]>([]);

  const supabase = createClient();

  const allocSum = useMemo(
    () => rows.reduce((s, r) => s + (parseFloat(r.alloc) || 0), 0),
    [rows]
  );
  const sumOk = Math.round(allocSum) === 100;
  const filledRows = rows.filter((r) => r.ticker.trim() && parseFloat(r.alloc) > 0);

  const loadSaved = useCallback(async () => {
    const { data } = await supabase
      .from("stress_test_portfolios")
      .select("id, name, holdings, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    setSaved((data as SavedPortfolio[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { ticker: "", alloc: "" }]);
  }
  function removeRow(i: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function runStressTest() {
    if (!sumOk || filledRows.length === 0) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const resolved = await Promise.all(
        filledRows.map(async (r): Promise<HoldingResolved> => {
          const t = r.ticker.trim().toUpperCase();
          const res = await fetch(`/api/stock/${t}`);
          if (!res.ok) throw new Error(`Couldn't load ${t}.`);
          const json = await res.json();
          return {
            ticker: t,
            alloc: parseFloat(r.alloc) || 0,
            sector: sectorForIndustry(json.profile?.industry),
            price: json.quote?.price ?? null,
          };
        })
      );
      setResults({
        resolved,
        crises: computeCrises(resolved),
        breakdown: sectorBreakdown(resolved),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stress test failed.");
    } finally {
      setLoading(false);
    }
  }

  async function savePortfolio() {
    if (!name.trim() || filledRows.length === 0) return;
    setSaving(true);
    await supabase.from("stress_test_portfolios").insert({
      user_id: userId,
      name: name.trim(),
      holdings: filledRows.map((r) => ({
        ticker: r.ticker.trim().toUpperCase(),
        alloc: parseFloat(r.alloc) || 0,
      })),
    });
    setSaving(false);
    setName("");
    loadSaved();
  }

  function loadPortfolio(p: SavedPortfolio) {
    setRows(p.holdings.map((h) => ({ ticker: h.ticker, alloc: String(h.alloc) })));
    setResults(null);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div className="space-y-12">
        {/* Builder */}
        <section>
          <SectionHeading
            title="Build a portfolio"
            note={`Allocation ${Math.round(allocSum)}%`}
          />
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  value={r.ticker}
                  onChange={(e) => updateRow(i, { ticker: e.target.value.toUpperCase() })}
                  placeholder="Ticker"
                  maxLength={10}
                  className={`${inputCls} w-32 font-mono`}
                />
                <div className="relative w-32">
                  <input
                    value={r.alloc}
                    onChange={(e) => updateRow(i, { alloc: e.target.value })}
                    inputMode="decimal"
                    placeholder="0"
                    className={`${inputCls} w-full pr-7`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-faint">
                    %
                  </span>
                </div>
                <button
                  onClick={() => removeRow(i)}
                  aria-label="Remove holding"
                  className="text-faint transition-colors hover:text-[#cb7e68]"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={addRow}
              className="rounded-xl border border-dashed border-hairline-strong px-4 py-2 text-sm text-muted transition-colors hover:border-gold hover:text-gold"
            >
              + Add holding
            </button>
            <button
              onClick={runStressTest}
              disabled={!sumOk || loading || filledRows.length === 0}
              className="rounded-xl bg-gold px-6 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Running…" : "Run Stress Test"}
            </button>
            {!sumOk && filledRows.length > 0 && (
              <span className="text-xs text-[#cb7e68]">
                Allocations must total 100% (currently {Math.round(allocSum)}%).
              </span>
            )}
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10 px-5 py-4 text-sm text-[#cb7e68]">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {results && !loading && <ResultsView results={results} />}
      </div>

      {/* Saved portfolios */}
      <aside>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-faint">
          Saved Portfolios
        </h3>
        <div className="mb-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Portfolio name"
            className={`${inputCls} min-w-0 flex-1`}
          />
          <button
            onClick={savePortfolio}
            disabled={saving || !name.trim() || filledRows.length === 0}
            className="shrink-0 rounded-xl border border-hairline-strong px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
          >
            {saving ? "…" : "Save"}
          </button>
        </div>
        {saved.length === 0 ? (
          <p className="text-sm text-faint">No saved portfolios yet.</p>
        ) : (
          <div className="space-y-2">
            {saved.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPortfolio(p)}
                className="block w-full rounded-xl border border-hairline bg-[#ece6d9]/[0.02] p-3 text-left transition-colors hover:border-gold/40"
              >
                <p className="truncate text-sm font-medium text-paper">{p.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-faint">
                  {p.holdings.map((h) => h.ticker).join(" · ")}
                </p>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

function ResultsView({ results }: { results: Results }) {
  const { crises, breakdown } = results;
  const crisisData = crises.map((c) => ({
    name: c.name.replace(/ .*/, ""),
    full: c.name,
    drawdown: Number(c.drawdownPct.toFixed(1)),
  }));
  const pieData = breakdown.map((b) => ({ name: b.label, value: Number(b.weight.toFixed(1)) }));

  return (
    <div className="space-y-12">
      {/* Crisis chart + table */}
      <section>
        <SectionHeading title="Historical stress scenarios" note="On a $10k stake" />
        <div className="mb-8 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={crisisData} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: FAINT, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip cursor={{ fill: "rgba(236,230,217,0.04)" }} content={<CrisisTooltip />} />
              <Bar dataKey="drawdown" radius={[4, 4, 0, 0]} maxBarSize={56}>
                {crisisData.map((d, i) => (
                  <Cell key={i} fill={d.drawdown >= 0 ? DOWN : UP} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                {["Crisis", "Est. drawdown", "Loss on $10k", "Recovery"].map((h) => (
                  <th key={h} className="py-3 pr-4 text-xs font-medium uppercase tracking-[0.15em] text-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crises.map((c) => (
                <tr key={c.key} className="border-b border-hairline/60">
                  <td className="py-3 pr-4">
                    <span className="text-paper">{c.name}</span>
                    <span className="block text-[11px] text-faint">{c.blurb}</span>
                  </td>
                  <td
                    className="py-3 pr-4 font-mono"
                    style={{ color: c.drawdownPct >= 0 ? DOWN : UP }}
                  >
                    {c.drawdownPct >= 0 ? "−" : "+"}
                    {Math.abs(c.drawdownPct).toFixed(1)}%
                  </td>
                  <td className="py-3 pr-4 font-mono text-muted">
                    {c.dollarLoss > 0 ? `−${formatPrice(c.dollarLoss)}` : "—"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-muted">
                    {c.drawdownPct > 0 ? `~${c.recoveryMonths} mo` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Analysis stub */}
        <div className="mt-6">
          <button
            type="button"
            disabled
            title="Requires Anthropic API credits"
            className="cursor-not-allowed rounded-xl border border-hairline px-5 py-2.5 text-sm font-medium text-faint opacity-60"
          >
            AI Risk Analysis
          </button>
        </div>
      </section>

      {/* Concentration */}
      <section>
        <SectionHeading title="Concentration risk" note="Sector breakdown" />
        <div className="grid items-center gap-8 sm:grid-cols-[240px_1fr]">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {breakdown.map((b, i) => (
              <div key={b.sector} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                />
                <span className="flex-1 text-sm text-muted">{b.label}</span>
                <span className="font-mono text-sm text-paper">{b.weight.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <p className="text-[11px] text-faint">
        Drawdowns are sector-based estimates of past crises for illustration — not
        precise backtests, and not financial advice.
      </p>
    </div>
  );
}

function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-8 flex items-baseline justify-between border-b border-hairline pb-4">
      <h2 className="font-serif text-2xl font-light tracking-editorial">{title}</h2>
      <p className="text-xs uppercase tracking-[0.15em] text-faint">{note}</p>
    </div>
  );
}

interface CrisisTooltipProps {
  active?: boolean;
  payload?: { payload: { full: string; drawdown: number } }[];
}
function CrisisTooltip({ active, payload }: CrisisTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#ece6d9]/[0.1] bg-black/80 px-3 py-2 text-xs backdrop-blur-xl">
      <p className="mb-0.5 text-zinc-400">{p.full}</p>
      <p
        className="font-mono font-semibold"
        style={{ color: p.drawdown >= 0 ? DOWN : UP }}
      >
        {p.drawdown >= 0 ? "−" : "+"}
        {Math.abs(p.drawdown).toFixed(1)}%
      </p>
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
}
function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#ece6d9]/[0.1] bg-black/80 px-3 py-2 text-xs backdrop-blur-xl">
      <span className="text-zinc-300">{payload[0].name}</span>{" "}
      <span className="font-mono text-[#c8a45d]">{payload[0].value}%</span>
    </div>
  );
}
