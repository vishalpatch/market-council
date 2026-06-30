"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import VerdictBadge from "@/components/committee/VerdictBadge";
import type { CommitteeResult } from "@/lib/committee-types";

const GOLD = "#c8a45d";
const UP = "#7ba890";
const DOWN = "#cb7e68";
const MUTED = "#9b9486";
const FAINT = "#6c665b";
const GRID = "rgba(236,230,217,0.07)";

interface Analysis {
  id: string;
  thesis: string;
  result: CommitteeResult;
  created_at: string;
  outcome_note: string | null;
  user_agreement: boolean | null;
}

const STOPWORDS = new Set([
  "I", "A", "AN", "THE", "IS", "IT", "IF", "OR", "AND", "BUT", "TO", "OF", "IN",
  "ON", "AT", "BE", "DO", "GO", "US", "WE", "MY", "SO", "AS", "BY", "UP",
]);

function extractTickers(thesis: string): string[] {
  const matches = thesis.match(/\b[A-Z]{1,5}\b/g) ?? [];
  return matches.filter((m) => !STOPWORDS.has(m));
}

export default function ConvictionClient() {
  const [analyses, setAnalyses] = useState<Analysis[] | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("committee_analyses")
      .select("id, thesis, result, created_at, outcome_note, user_agreement")
      .order("created_at", { ascending: false });
    setAnalyses((data as Analysis[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveOutcome(id: string, note: string) {
    await supabase.from("committee_analyses").update({ outcome_note: note }).eq("id", id);
    setAnalyses((prev) =>
      prev?.map((a) => (a.id === id ? { ...a, outcome_note: note } : a)) ?? prev
    );
  }

  async function setAgreement(id: string, value: boolean) {
    const current = analyses?.find((a) => a.id === id)?.user_agreement;
    const next = current === value ? null : value; // toggle off if re-clicked
    await supabase.from("committee_analyses").update({ user_agreement: next }).eq("id", id);
    setAnalyses((prev) =>
      prev?.map((a) => (a.id === id ? { ...a, user_agreement: next } : a)) ?? prev
    );
  }

  const stats = useMemo(() => {
    if (!analyses) return null;
    let bull = 0;
    let bear = 0;
    let neutral = 0;
    let scoreSum = 0;
    let agree = 0;
    let decided = 0;
    const tickerMap = new Map<string, number>();
    const monthMap = new Map<string, number>();

    for (const a of analyses) {
      const v = a.result?.chairman?.verdict;
      if (v === "BULLISH") bull++;
      else if (v === "BEARISH") bear++;
      else neutral++;
      scoreSum += a.result?.chairman?.overallScore ?? 0;

      if (a.user_agreement !== null) {
        decided++;
        if (a.user_agreement) agree++;
      }
      for (const t of extractTickers(a.thesis)) {
        tickerMap.set(t, (tickerMap.get(t) ?? 0) + 1);
      }
      const d = new Date(a.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }

    const total = analyses.length;
    const directional = bull + bear;
    const timeline = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([key, count]) => {
        const [y, m] = key.split("-");
        return {
          label: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
            month: "short",
          }),
          count,
        };
      });
    const topTickers = Array.from(tickerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      total,
      bull,
      bear,
      neutral,
      bullPct: directional ? Math.round((bull / directional) * 100) : null,
      avgScore: total ? Math.round(scoreSum / total) : 0,
      agreeRate: decided ? Math.round((agree / decided) * 100) : null,
      decided,
      agree,
      timeline,
      topTickers,
    };
  }, [analyses]);

  if (!stats) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece6d9]/[0.14] bg-[#ece6d9]/[0.02] p-12 text-center">
        <h2 className="mb-3 font-serif text-2xl font-light">No analyses to track yet</h2>
        <p className="mx-auto max-w-sm text-pretty leading-relaxed text-muted">
          Convene the committee on a few theses and save them — this page then tracks
          your conviction patterns, biases, and how your calls played out.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Behavioral insights */}
      <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
        <Stat label="Analyses" value={String(stats.total)} />
        <Stat
          label="Bullish bias"
          value={stats.bullPct === null ? "—" : `${stats.bullPct}%`}
          color={GOLD}
        />
        <Stat label="Avg conviction" value={`${stats.avgScore}/100`} />
        <Stat
          label="Agreement rate"
          value={stats.agreeRate === null ? "—" : `${stats.agreeRate}%`}
          color={UP}
        />
      </div>

      {/* Bias + timeline */}
      <div className="grid gap-12 lg:grid-cols-2">
        <section>
          <SectionHeading title="Directional bias" note="Across saved theses" />
          <div className="mb-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[#ece6d9]/[0.06]">
            {[
              { v: stats.bull, c: GOLD },
              { v: stats.neutral, c: "rgba(155,148,134,0.5)" },
              { v: stats.bear, c: DOWN },
            ].map((seg, i) =>
              seg.v > 0 ? (
                <div key={i} style={{ width: `${(seg.v / stats.total) * 100}%`, backgroundColor: seg.c }} />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-gold">Bullish {stats.bull}</span>
            <span className="text-muted">Neutral {stats.neutral}</span>
            <span className="text-[#cb7e68]">Bearish {stats.bear}</span>
          </div>
        </section>

        <section>
          <SectionHeading title="Most analyzed" note="By ticker" />
          {stats.topTickers.length === 0 ? (
            <p className="text-sm text-muted">No tickers detected in your theses.</p>
          ) : (
            <div className="space-y-2">
              {stats.topTickers.map(([t, n]) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-16 font-mono text-sm text-paper">{t}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#ece6d9]/[0.06]">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(n / stats.topTickers[0][1]) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted">{n}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Timeline */}
      <section>
        <SectionHeading title="Analyses over time" note="Per month" />
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.timeline} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: FAINT, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip cursor={{ fill: "rgba(236,230,217,0.04)" }} content={<TimelineTooltip />} />
              <Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Per-analysis log */}
      <section>
        <SectionHeading title="Your calls" note="Outcome & agreement" />
        <div className="space-y-4">
          {analyses!.map((a) => (
            <AnalysisCard
              key={a.id}
              analysis={a}
              onSaveOutcome={(note) => saveOutcome(a.id, note)}
              onAgree={(v) => setAgreement(a.id, v)}
            />
          ))}
        </div>
      </section>

      <p className="text-[11px] text-faint">
        For informational purposes only — not financial advice.
      </p>
    </div>
  );
}

function AnalysisCard({
  analysis,
  onSaveOutcome,
  onAgree,
}: {
  analysis: Analysis;
  onSaveOutcome: (note: string) => void;
  onAgree: (value: boolean) => void;
}) {
  const [note, setNote] = useState(analysis.outcome_note ?? "");
  const verdict = analysis.result?.chairman?.verdict ?? "NEUTRAL";
  const score = analysis.result?.chairman?.overallScore ?? 0;

  return (
    <div className="rounded-2xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] p-5 backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <VerdictBadge verdict={verdict} size="sm" />
        <span className="font-mono text-xs text-muted">{score}/100</span>
        <span className="ml-auto text-xs text-faint">
          {new Date(analysis.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-zinc-300">
        {analysis.result?.thesisSummary || analysis.thesis}
      </p>

      <div className="flex flex-col gap-4 border-t border-[#ece6d9]/[0.06] pt-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-faint">
            What happened?
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== (analysis.outcome_note ?? "")) onSaveOutcome(note);
            }}
            rows={2}
            placeholder="Note how this call played out…"
            className="w-full resize-none rounded-xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] px-3 py-2 text-sm text-paper placeholder-faint focus:border-gold/50 focus:outline-none"
          />
        </div>

        <div className="shrink-0">
          <p className="mb-1.5 text-[11px] uppercase tracking-wider text-faint">
            Your view
          </p>
          <div className="flex gap-2">
            {[
              { v: true, label: "Agreed", cls: "border-[#7ba890]/50 bg-[#7ba890]/[0.12] text-[#7ba890]" },
              { v: false, label: "Disagreed", cls: "border-[#cb7e68]/50 bg-[#cb7e68]/[0.12] text-[#cb7e68]" },
            ].map((o) => (
              <button
                key={o.label}
                onClick={() => onAgree(o.v)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  analysis.user_agreement === o.v
                    ? o.cls
                    : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border-t border-hairline pt-5 sm:pr-6">
      <p className="text-xs uppercase tracking-[0.15em] text-faint">{label}</p>
      <p className="mt-2 font-serif text-3xl font-light" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-4">
      <h2 className="font-serif text-2xl font-light tracking-editorial">{title}</h2>
      <p className="text-xs uppercase tracking-[0.15em] text-faint">{note}</p>
    </div>
  );
}

interface TimelineTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}
function TimelineTooltip({ active, payload, label }: TimelineTooltipProps) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-lg border border-[#ece6d9]/[0.1] bg-black/80 px-3 py-2 text-xs backdrop-blur-xl">
      <p className="mb-0.5 text-zinc-400">{label}</p>
      <p className="font-mono font-semibold text-[#c8a45d]">
        {v} {v === 1 ? "analysis" : "analyses"}
      </p>
    </div>
  );
}
