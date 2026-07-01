"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "Watching" | "Entered" | "Exited";
type Outcome = "win" | "loss" | "neutral";

interface JournalEntry {
  id: string;
  ticker: string;
  thesis: string;
  status: Status;
  outcome: Outcome | null;
  created_at: string;
}

const STATUSES: Status[] = ["Watching", "Entered", "Exited"];

const STATUS_STYLES: Record<Status, string> = {
  Watching: "border-hairline-strong bg-zinc-500/10 text-muted",
  Entered:  "border-[#c8a45d]/40 bg-[#c8a45d]/10 text-[#c8a45d]",
  Exited:   "border-hairline-strong bg-zinc-700/20 text-muted line-through",
};

const OUTCOMES: Outcome[] = ["win", "loss", "neutral"];
const OUTCOME_LABEL: Record<Outcome, string> = {
  win: "Win",
  loss: "Loss",
  neutral: "Neutral",
};
const OUTCOME_STYLES: Record<Outcome, string> = {
  win: "border-[#7ba890]/50 bg-[#7ba890]/[0.12] text-[#7ba890]",
  loss: "border-[#cb7e68]/50 bg-[#cb7e68]/[0.12] text-[#cb7e68]",
  neutral: "border-hairline-strong bg-zinc-500/10 text-muted",
};

export default function JournalClient({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [ticker, setTicker] = useState("");
  const [thesis, setThesis] = useState("");
  const [status, setStatus] = useState<Status>("Watching");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const supabase = createClient();

  const loadEntries = useCallback(async () => {
    const { data } = await supabase
      .from("journal_entries")
      .select("id, ticker, thesis, status, outcome, created_at")
      .order("created_at", { ascending: false });
    setEntries((data as JournalEntry[]) ?? []);
  }, [supabase]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    const th = thesis.trim();
    if (!t || !th) return;
    setSaving(true);
    setFormError("");
    const { error } = await supabase.from("journal_entries").insert({
      user_id: userId,
      ticker: t,
      thesis: th,
      status,
    });
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setTicker("");
    setThesis("");
    setStatus("Watching");
    setShowForm(false);
    loadEntries();
  }

  async function cycleStatus(entry: JournalEntry) {
    const next = STATUSES[(STATUSES.indexOf(entry.status) + 1) % STATUSES.length];
    const { error } = await supabase
      .from("journal_entries")
      .update({ status: next })
      .eq("id", entry.id);
    if (!error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, status: next } : e))
      );
    }
  }

  async function setOutcome(entry: JournalEntry, value: Outcome) {
    const next = entry.outcome === value ? null : value; // toggle off if re-clicked
    const { error } = await supabase
      .from("journal_entries")
      .update({ outcome: next })
      .eq("id", entry.id);
    if (!error) {
      setEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, outcome: next } : e))
      );
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("journal_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div>
      {/* Add entry */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 rounded-xl border border-dashed border-hairline-strong px-5 py-3 text-sm font-medium text-muted transition-colors hover:border-hairline-strong hover:text-paper"
        >
          + New Entry
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5 backdrop-blur-xl"
        >
          <h3 className="mb-4 text-sm font-semibold text-muted">New Journal Entry</h3>
          <div className="mb-3 flex flex-wrap gap-3">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Ticker (e.g. TSLA)"
              maxLength={10}
              required
              className="w-36 rounded-xl border border-[var(--edge)] bg-[var(--surface)] px-4 py-2.5 font-mono text-sm text-paper placeholder-faint focus:border-[var(--edge-2)] focus:outline-none"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="rounded-xl border border-[var(--edge)] bg-ink-raised px-4 py-2.5 text-sm text-paper focus:border-[var(--edge-2)] focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <textarea
            value={thesis}
            onChange={(e) => setThesis(e.target.value)}
            placeholder="Write your thesis or reasoning…"
            rows={4}
            required
            className="mb-3 w-full resize-none rounded-xl border border-[var(--edge)] bg-[var(--surface)] px-4 py-3 text-sm text-paper placeholder-faint focus:border-[var(--edge-2)] focus:outline-none"
          />
          {formError && <p className="mb-3 text-xs text-[#cb7e68]">{formError}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#c8a45d] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#c8a45d]/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Entry"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="text-sm text-muted hover:text-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Entry list */}
      {entries.length === 0 ? (
        <p className="text-sm text-faint">
          No journal entries yet. Log your first investment idea above.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5 backdrop-blur-xl transition-colors hover:border-[var(--edge-2)]"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-base font-bold text-paper">
                  {entry.ticker}
                </span>
                <button
                  onClick={() => cycleStatus(entry)}
                  title="Click to change status"
                  className={`rounded-full border px-3 py-0.5 text-xs font-semibold transition-opacity hover:opacity-70 ${STATUS_STYLES[entry.status]}`}
                >
                  {entry.status}
                </button>
                <span className="ml-auto text-xs text-faint">
                  {new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete entry"
                  className="text-faint opacity-0 transition-opacity hover:text-[#cb7e68] group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm leading-relaxed text-muted">{entry.thesis}</p>

              {entry.status === "Exited" && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--edge)] pt-3">
                  <span className="text-[11px] uppercase tracking-wider text-muted">
                    Outcome
                  </span>
                  {OUTCOMES.map((o) => (
                    <button
                      key={o}
                      onClick={() => setOutcome(entry, o)}
                      className={`rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors ${
                        entry.outcome === o
                          ? OUTCOME_STYLES[o]
                          : "border-hairline-strong text-muted hover:text-muted"
                      }`}
                    >
                      {OUTCOME_LABEL[o]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
