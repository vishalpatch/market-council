"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";
import UpgradeModal from "@/components/UpgradeModal";

interface Turn {
  role: "bull" | "bear";
  text: string;
}

interface Verdict {
  winner: "bull" | "bear" | "draw";
  bullScore: number;
  bearScore: number;
  reasoning: string;
}

const MAX_ROUNDS = 5;

const inputCls =
  "w-full rounded-xl border border-[var(--edge)] bg-[var(--surface)] px-4 py-3 text-sm text-paper placeholder-faint transition-colors focus:border-gold/50 focus:outline-none";

export default function DevilsAdvocateClient({ userId }: { userId: string }) {
  const [ticker, setTicker] = useState("");
  const [thesis, setThesis] = useState("");
  const [thread, setThread] = useState<Turn[]>([]);
  const [reply, setReply] = useState("");
  const [phase, setPhase] = useState<"setup" | "debating" | "done">("setup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const bearReplies = thread.filter((t) => t.role === "bear").length;
  const maxedOut = bearReplies >= MAX_ROUNDS;

  function showError(err: unknown, fallback: string) {
    const m = err instanceof Error ? err.message : fallback;
    if (m !== "__upgrade__") setError(m);
  }

  async function callApi(mode: "debate" | "referee", nextThread: Turn[]) {
    const res = await fetch("/api/devils-advocate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), mode, thread: nextThread }),
    });
    const json = await res.json();
    if (!res.ok) {
      if (res.status === 402) {
        setUpgradeMsg(json.error ?? "Upgrade to continue.");
        throw new Error("__upgrade__");
      }
      throw new Error(json.error ?? "Request failed.");
    }
    return json;
  }

  async function startDebate(e: React.FormEvent) {
    e.preventDefault();
    if (!thesis.trim()) return;
    setLoading(true);
    setError("");
    const next: Turn[] = [{ role: "bull", text: thesis.trim() }];
    try {
      const { text } = await callApi("debate", next);
      setThread([...next, { role: "bear", text }]);
      setPhase("debating");
    } catch (err) {
      showError(err, "Failed to start.");
    } finally {
      setLoading(false);
    }
  }

  async function respond() {
    if (!reply.trim() || maxedOut) return;
    setLoading(true);
    setError("");
    const next: Turn[] = [...thread, { role: "bull", text: reply.trim() }];
    setThread(next);
    setReply("");
    try {
      const { text } = await callApi("debate", next);
      setThread([...next, { role: "bear", text }]);
    } catch (err) {
      showError(err, "Failed to respond.");
    } finally {
      setLoading(false);
    }
  }

  async function endDebate() {
    setLoading(true);
    setError("");
    try {
      const { verdict: v } = await callApi("referee", thread);
      setVerdict(v as Verdict);
      setPhase("done");
      await createClient()
        .from("devils_advocate_debates")
        .insert({
          user_id: userId,
          ticker: ticker.trim().toUpperCase() || null,
          rounds: thread,
          referee_verdict: v,
        });
    } catch (err) {
      showError(err, "Failed to judge.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setTicker("");
    setThesis("");
    setThread([]);
    setReply("");
    setVerdict(null);
    setError("");
    setPhase("setup");
  }

  return (
    <div>
      <UpgradeModal open={!!upgradeMsg} message={upgradeMsg} onClose={() => setUpgradeMsg("")} />
      <p className="mb-8 text-xs text-muted">Powered by Claude</p>

      {phase === "setup" && (
        <form onSubmit={startDebate} className="space-y-4">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Ticker (optional, e.g. NVDA)"
            maxLength={10}
            className={`${inputCls} font-mono sm:w-48`}
          />
          <textarea
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            rows={5}
            placeholder="Make your bull case. Be specific — the Devil's Advocate will rebut your exact points."
            className={`${inputCls} resize-none`}
          />
          <button
            type="submit"
            disabled={loading || !thesis.trim()}
            className="rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Summoning…" : "Start the Debate"}
          </button>
        </form>
      )}

      {error && (
        <div className="my-6 rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10 px-5 py-4 text-sm text-[#cb7e68]">
          {error}
        </div>
      )}

      {thread.length > 0 && (
        <div className="mt-6 space-y-4">
          {thread.map((t, i) => (
            <Bubble key={i} turn={t} />
          ))}

          {loading && phase === "debating" && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spinner size="sm" /> The Devil&apos;s Advocate is thinking…
            </div>
          )}
        </div>
      )}

      {phase === "debating" && (
        <div className="mt-6 space-y-3">
          {!maxedOut ? (
            <>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder="Defend your thesis against that rebuttal…"
                className={`${inputCls} resize-none`}
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={respond}
                  disabled={loading || !reply.trim()}
                  className="rounded-xl bg-gold px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft disabled:opacity-40"
                >
                  Respond
                </button>
                <button
                  onClick={endDebate}
                  disabled={loading}
                  className="rounded-xl border border-hairline-strong px-5 py-2 text-sm font-semibold text-paper transition-colors hover:border-gold hover:text-gold disabled:opacity-40"
                >
                  End &amp; Judge
                </button>
                <span className="self-center text-xs text-faint">
                  Round {bearReplies}/{MAX_ROUNDS}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">
                Maximum {MAX_ROUNDS} rounds reached.
              </span>
              <button
                onClick={endDebate}
                disabled={loading}
                className="rounded-xl bg-gold px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft disabled:opacity-40"
              >
                {loading ? "Judging…" : "Get the Verdict"}
              </button>
            </div>
          )}
        </div>
      )}

      {phase === "done" && verdict && (
        <div className="mt-8">
          <RefereeCard verdict={verdict} />
          <button
            onClick={reset}
            className="mt-6 rounded-xl border border-hairline-strong px-5 py-2 text-sm font-medium text-paper transition-colors hover:border-gold hover:text-gold"
          >
            New Debate
          </button>
        </div>
      )}
    </div>
  );
}

function Bubble({ turn }: { turn: Turn }) {
  const isBull = turn.role === "bull";
  return (
    <div className={`flex ${isBull ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl border p-4 text-sm leading-relaxed ${
          isBull
            ? "border-gold/30 bg-gold/[0.06] text-paper"
            : "border-[#cb7e68]/30 bg-[#cb7e68]/[0.06] text-paper"
        }`}
      >
        <p
          className={`mb-1.5 text-[11px] font-semibold uppercase tracking-wider ${
            isBull ? "text-gold" : "text-[#cb7e68]"
          }`}
        >
          {isBull ? "You · Bull" : "Devil's Advocate · Bear"}
        </p>
        <p className="whitespace-pre-wrap">{turn.text}</p>
      </div>
    </div>
  );
}

function RefereeCard({ verdict }: { verdict: Verdict }) {
  const winnerLabel =
    verdict.winner === "bull" ? "Bull (You)" : verdict.winner === "bear" ? "Bear" : "Draw";
  const accent =
    verdict.winner === "bull" ? "#c8a45d" : verdict.winner === "bear" ? "#cb7e68" : "#9b9486";
  return (
    <div
      className="rounded-2xl border bg-[var(--surface)] p-6 backdrop-blur-xl"
      style={{ borderColor: `${accent}40` }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-xl">
          ⚖️
        </span>
        <div>
          <h3 className="font-serif text-xl font-light text-paper">The Referee</h3>
          <p className="text-xs text-faint">Stronger argument</p>
        </div>
        <span className="ml-auto font-serif text-lg" style={{ color: accent }}>
          {winnerLabel}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4">
        <ScoreBar label="Bull (You)" score={verdict.bullScore} color="#c8a45d" />
        <ScoreBar label="Bear" score={verdict.bearScore} color="#cb7e68" />
      </div>

      <p className="text-sm leading-relaxed text-muted">{verdict.reasoning}</p>
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-mono" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
