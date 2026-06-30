"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "Watching" | "Entered" | "Exited";

interface JournalEntry {
  id: string;
  ticker: string;
  thesis: string;
  status: Status;
  created_at: string;
}

const STATUSES: Status[] = ["Watching", "Entered", "Exited"];

const STATUS_STYLES: Record<Status, string> = {
  Watching: "border-zinc-600/50 bg-zinc-500/10 text-zinc-300",
  Entered:  "border-[#00dc82]/40 bg-[#00dc82]/10 text-[#00dc82]",
  Exited:   "border-zinc-600/40 bg-zinc-700/20 text-zinc-500 line-through",
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
      .select("id, ticker, thesis, status, created_at")
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
          className="mb-8 rounded-xl border border-dashed border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
        >
          + New Entry
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl"
        >
          <h3 className="mb-4 text-sm font-semibold text-zinc-300">New Journal Entry</h3>
          <div className="mb-3 flex flex-wrap gap-3">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Ticker (e.g. TSLA)"
              maxLength={10}
              required
              className="w-36 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 font-mono text-sm text-zinc-50 placeholder-zinc-600 focus:border-white/[0.2] focus:outline-none"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="rounded-xl border border-white/[0.08] bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 focus:border-white/[0.2] focus:outline-none"
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
            className="mb-3 w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-zinc-50 placeholder-zinc-600 focus:border-white/[0.2] focus:outline-none"
          />
          {formError && <p className="mb-3 text-xs text-[#ff5470]">{formError}</p>}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#00dc82] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#00dc82]/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Entry"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Entry list */}
      {entries.length === 0 ? (
        <p className="text-sm text-zinc-600">
          No journal entries yet. Log your first investment idea above.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl transition-colors hover:border-white/[0.16]"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-base font-bold text-zinc-50">
                  {entry.ticker}
                </span>
                <button
                  onClick={() => cycleStatus(entry)}
                  title="Click to change status"
                  className={`rounded-full border px-3 py-0.5 text-xs font-semibold transition-opacity hover:opacity-70 ${STATUS_STYLES[entry.status]}`}
                >
                  {entry.status}
                </button>
                <span className="ml-auto text-xs text-zinc-600">
                  {new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete entry"
                  className="text-zinc-600 opacity-0 transition-opacity hover:text-[#ff5470] group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm leading-relaxed text-zinc-300">{entry.thesis}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
