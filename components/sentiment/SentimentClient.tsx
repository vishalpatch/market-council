"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import VerdictBadge from "@/components/committee/VerdictBadge";
import NewsFeed, { type NewsItem } from "@/components/stock/NewsFeed";
import UpgradeModal from "@/components/UpgradeModal";
import type { SentimentResult } from "@/lib/sentiment-types";

interface Analysis {
  ticker: string;
  companyName: string;
  sentiment: SentimentResult;
  news: NewsItem[];
}

function accentFor(verdict: SentimentResult["verdict"]) {
  if (verdict === "BULLISH") return "#c8a45d";
  if (verdict === "BEARISH") return "#cb7e68";
  return "#9b9486";
}

export default function SentimentClient() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticker = input.trim().toUpperCase();
    if (!ticker) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setUpgradeMsg(json.error ?? "Upgrade to continue.");
          return;
        }
        setError(json.error ?? "Could not analyze sentiment.");
        return;
      }
      setResult(json as Analysis);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <UpgradeModal open={!!upgradeMsg} message={upgradeMsg} onClose={() => setUpgradeMsg("")} />
      {/* Ticker input */}
      <form onSubmit={handleSubmit} className="mb-10 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="Enter a ticker — AAPL, NVDA, TSLA…"
          maxLength={10}
          className="flex-1 rounded-xl border border-[var(--edge)] bg-[var(--surface)] px-4 py-3 font-mono text-sm tracking-wide text-paper placeholder-faint transition-colors focus:border-gold/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Reading…" : "Analyze"}
        </button>
      </form>

      {error && (
        <div className="mb-6 rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10 px-5 py-4 text-sm text-[#cb7e68]">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-12 text-center backdrop-blur-xl">
          <div className="mx-auto mb-5 flex justify-center">
            <Spinner size="md" />
          </div>
          <p className="font-medium text-paper">Reading the tape…</p>
          <p className="mt-1 text-sm text-muted">
            Pulling recent headlines and gauging sentiment.
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-10">
          {/* Sentiment gauge */}
          <SentimentGauge analysis={result} />

          {/* Headlines */}
          <section>
            <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-4">
              <h2 className="font-serif text-2xl font-light tracking-editorial">
                Headlines analyzed
              </h2>
              <p className="text-xs uppercase tracking-[0.15em] text-faint">
                Source · Finnhub
              </p>
            </div>
            <NewsFeed news={result.news} />
          </section>

          <p className="text-[11px] text-faint">
            AI-generated from recent headlines, for informational purposes only —
            not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}

function SentimentGauge({ analysis }: { analysis: Analysis }) {
  const { sentiment } = analysis;
  const accent = accentFor(sentiment.verdict);
  const pct = (sentiment.intensity / 10) * 100;

  return (
    <div
      className="rounded-2xl border bg-[var(--surface)] p-6 backdrop-blur-xl"
      style={{ borderColor: `${accent}40` }}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-3xl font-light tracking-editorial">
              {analysis.companyName}
            </h2>
            <span className="rounded-md bg-[var(--surface-3)] px-2 py-0.5 font-mono text-xs text-muted">
              {analysis.ticker}
            </span>
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.15em] text-faint">
            News sentiment
          </p>
        </div>
        <VerdictBadge verdict={sentiment.verdict} />
      </div>

      {/* Intensity meter */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>Signal intensity</span>
          <span className="font-mono" style={{ color: accent }}>
            {sentiment.intensity}/10
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: accent }}
          />
        </div>
      </div>

      <p className="leading-relaxed text-muted">{sentiment.explanation}</p>
    </div>
  );
}
