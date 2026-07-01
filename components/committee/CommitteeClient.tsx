"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CommitteeResult } from "@/lib/committee-types";
import { firstTicker } from "@/lib/tickers";
import PersonaCard from "./PersonaCard";
import VerdictBadge from "./VerdictBadge";
import Spinner from "@/components/Spinner";

interface SavedAnalysis {
  id: string;
  thesis: string;
  result: CommitteeResult;
  created_at: string;
}

export default function CommitteeClient({ userId }: { userId: string }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CommitteeResult | null>(null);
  const [thesis, setThesis] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const [historyError, setHistoryError] = useState("");

  const supabase = createClient();

  const loadHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("committee_analyses")
      .select("id, thesis, result, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) {
      setHistoryError(error.message);
      return;
    }
    setHistory((data as SavedAnalysis[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;

    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch("/api/committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "The committee could not convene.");
        return;
      }
      setResult(json as CommitteeResult);
      setThesis(value);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setHistoryError("");
    const { data, error } = await supabase
      .from("committee_analyses")
      .insert({ user_id: userId, thesis, result })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      setHistoryError(error.message);
      return;
    }
    setSaved(true);
    loadHistory();

    // Snapshot the price for the Track Record page (best-effort; never blocks save).
    const ticker = firstTicker(thesis);
    if (ticker && data?.id) {
      try {
        const res = await fetch(`/api/stock/${ticker}`);
        if (res.ok) {
          const json = await res.json();
          const price = json.quote?.price;
          if (typeof price === "number" && price > 0) {
            await supabase.from("track_record_snapshots").insert({
              user_id: userId,
              analysis_id: data.id,
              ticker,
              price_at_submission: price,
            });
          }
        }
      } catch {
        /* snapshot is non-critical */
      }
    }
  }

  function openSaved(a: SavedAnalysis) {
    setResult(a.result);
    setThesis(a.thesis);
    setSaved(true);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        {/* Input */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-2 backdrop-blur-xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={3}
              placeholder='Enter a ticker (e.g. NVDA) or a thesis (e.g. "I think Apple is overvalued because of China risk")…'
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-paper placeholder-faint focus:outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[11px] text-faint">
                Enter to convene · Shift+Enter for a new line
              </span>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-[#c8a45d] px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-[#c8a45d]/90 hover:shadow-[0_0_24px_-4px_#c8a45d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Convening…" : "Convene Committee"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10 px-5 py-4 text-sm text-[#cb7e68]">
            {error}
          </div>
        )}

        {loading && <ConveningState />}

        {result && !loading && (
          <div className="space-y-6">
            {/* Thesis */}
            <div className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5 backdrop-blur-xl">
              <p className="mb-1 text-xs uppercase tracking-wider text-muted">
                Thesis under review
              </p>
              <p className="text-paper">{result.thesisSummary}</p>
            </div>

            {/* Chairman — the headline verdict, shown first */}
            <ChairmanCard result={result} />

            {/* Personas */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                The Committee
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {result.personas.map((p, i) => (
                  <PersonaCard key={`${p.name}-${i}`} persona={p} />
                ))}
              </div>
            </div>

            {/* Save + Export */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="rounded-xl border border-[var(--edge)] bg-[var(--surface-2)] px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-[var(--edge-2)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saved ? "✓ Saved" : saving ? "Saving…" : "Save Analysis"}
              </button>
              <ExportPdfButton thesis={thesis} result={result} />
              {historyError && (
                <span className="text-xs text-[#cb7e68]">{historyError}</span>
              )}
            </div>
            <p className="text-[11px] text-faint">
              For educational and informational purposes only — not financial advice.
            </p>
          </div>
        )}
      </div>

      {/* History sidebar */}
      <aside>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
          Past Analyses
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-faint">
            No saved analyses yet. Convene a committee and save the verdict.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((a) => (
              <button
                key={a.id}
                onClick={() => openSaved(a)}
                className="block w-full rounded-xl border border-[var(--edge)] bg-[var(--surface)] p-3 text-left backdrop-blur-xl transition-colors hover:border-[var(--edge-2)]"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <VerdictBadge verdict={a.result.chairman.verdict} size="sm" />
                  <span className="font-mono text-xs text-muted">
                    {a.result.chairman.overallScore}/100
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted">{a.thesis}</p>
                <p className="mt-1 text-[10px] text-faint">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

function ChairmanCard({ result }: { result: CommitteeResult }) {
  const { chairman } = result;
  const accent =
    chairman.verdict === "BULLISH"
      ? "#c8a45d"
      : chairman.verdict === "BEARISH"
        ? "#cb7e68"
        : "#a1a1aa";
  return (
    <div
      className="rounded-2xl border bg-[var(--surface)] p-6 backdrop-blur-xl"
      style={{ borderColor: `${accent}40` }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-xl">
            ⚖️
          </div>
          <div>
            <h3 className="font-semibold text-paper">The Chairman</h3>
            <p className="text-xs text-muted">Final Synthesis</p>
          </div>
        </div>
        <VerdictBadge verdict={chairman.verdict} />
      </div>

      {/* Score */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted">
          <span>Overall Conviction</span>
          <span className="font-mono" style={{ color: accent }}>
            {chairman.overallScore}/100
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${chairman.overallScore}%`, backgroundColor: accent }}
          />
        </div>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-muted">{chairman.summary}</p>

      <div className="rounded-xl border border-[var(--edge)] bg-black/30 p-4">
        <p className="mb-1 text-[11px] uppercase tracking-wider text-muted">
          Recommendation
        </p>
        <p className="font-medium" style={{ color: accent }}>
          {chairman.recommendation}
        </p>
      </div>
    </div>
  );
}

function ExportPdfButton({
  thesis,
  result,
}: {
  thesis: string;
  result: CommitteeResult;
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const { exportCommitteePdf } = await import("@/lib/exportPdf");
      await exportCommitteePdf(thesis, result);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 rounded-xl border border-[var(--edge)] bg-[var(--surface-2)] px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:border-[var(--edge-2)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {exporting ? (
        <>
          <Spinner size="sm" />
          Generating…
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
            <path
              d="M7 1v8M4 6l3 3 3-3M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export PDF
        </>
      )}
    </button>
  );
}

function ConveningState() {
  const members = [
    "Value Analyst",
    "Momentum Trader",
    "Risk Manager",
    "Contrarian",
    "Macro Economist",
  ];
  return (
    <div className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-10 text-center backdrop-blur-xl">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center">
        <Spinner size="md" />
      </div>
      <p className="mb-1 font-medium text-paper">Convening the committee…</p>
      <p className="text-sm text-muted">
        Five analysts are debating your thesis.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {members.map((m, i) => (
          <span
            key={m}
            className="animate-pulse rounded-full border border-[var(--edge)] bg-[var(--surface)] px-3 py-1 text-xs text-muted"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
