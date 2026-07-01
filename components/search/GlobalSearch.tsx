"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ResultType = "page" | "watchlist" | "journal" | "analysis";

interface Cmd {
  type: ResultType;
  label: string;
  sublabel?: string;
  href: string;
}

interface Row {
  ticker?: string | null;
  thesis?: string | null;
}

const PAGES: Cmd[] = [
  { type: "page", label: "Committee", href: "/dashboard/committee" },
  { type: "page", label: "Devil's Advocate", href: "/dashboard/devils-advocate" },
  { type: "page", label: "Market Pulse", href: "/dashboard/sentiment" },
  { type: "page", label: "Track Record", href: "/dashboard/track-record" },
  { type: "page", label: "Investment Profile", href: "/dashboard/investment-profile" },
  { type: "page", label: "Morning Digest", href: "/dashboard/digest" },
  { type: "page", label: "Stock Explorer", href: "/dashboard/explorer" },
  { type: "page", label: "Earnings Calendar", href: "/dashboard/calendar" },
  { type: "page", label: "Watchlist", href: "/dashboard#watchlist" },
  { type: "page", label: "Risk Simulator", href: "/dashboard/risk" },
  { type: "page", label: "Stress Test", href: "/dashboard/stress-test" },
  { type: "page", label: "Trade Journal", href: "/dashboard/journal" },
  { type: "page", label: "Performance Analytics", href: "/dashboard/analytics" },
  { type: "page", label: "Conviction Tracker", href: "/dashboard/conviction" },
  { type: "page", label: "Dashboard", href: "/dashboard" },
];

const TYPE_LABEL: Record<ResultType, string> = {
  page: "Go to page",
  watchlist: "Watchlist",
  journal: "Journal",
  analysis: "Analysis",
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<{ watchlist: Cmd[]; journal: Cmd[]; analyses: Cmd[] } | null>(null);
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const [j, a, w] = await Promise.all([
      supabase.from("journal_entries").select("ticker, thesis").limit(250),
      supabase.from("committee_analyses").select("thesis").limit(250),
      supabase.from("watchlist_items").select("ticker").limit(250),
    ]);
    setData({
      journal: ((j.data as Row[]) ?? []).map((r) => ({
        type: "journal",
        label: r.ticker ?? "—",
        sublabel: r.thesis ?? "",
        href: "/dashboard/journal",
      })),
      analyses: ((a.data as Row[]) ?? []).map((r) => ({
        type: "analysis",
        label: (r.thesis ?? "").slice(0, 70) || "Untitled analysis",
        href: "/dashboard/conviction",
      })),
      watchlist: ((w.data as Row[]) ?? []).map((r) => ({
        type: "watchlist",
        label: r.ticker ?? "—",
        href: "/dashboard#watchlist",
      })),
    });
  }, []);

  useEffect(() => {
    if (open && !data) loadData();
  }, [open, data, loadData]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 20);
  }, [open]);
  useEffect(() => {
    setHi(0);
  }, [q, open]);

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const match = (c: Cmd) =>
      !query ||
      c.label.toLowerCase().includes(query) ||
      (c.sublabel ?? "").toLowerCase().includes(query);
    const out: { label: string; items: Cmd[] }[] = [];

    const pages = PAGES.filter(
      (c) => !query || c.label.toLowerCase().includes(query) || `go to ${c.label.toLowerCase()}`.includes(query)
    );
    if (pages.length) out.push({ label: "Pages", items: query ? pages : pages.slice(0, 6) });

    if (data) {
      const wl = data.watchlist.filter(match).slice(0, 8);
      if (wl.length) out.push({ label: "Watchlist", items: wl });
      const jr = data.journal.filter(match).slice(0, 8);
      if (jr.length) out.push({ label: "Journal", items: jr });
      const an = data.analyses.filter(match).slice(0, 8);
      if (an.length) out.push({ label: "Saved analyses", items: an });
    }
    return out;
  }, [q, data]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  function select(c: Cmd) {
    setOpen(false);
    setQ("");
    router.push(c.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[hi]) select(flat[hi]);
    }
  }

  if (!open) return null;

  let idx = -1;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
      onMouseDown={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-hairline-strong bg-ink-raised shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onInputKey}
          placeholder="Search theses, tickers, pages…"
          className="w-full border-b border-hairline bg-transparent px-5 py-4 text-sm text-paper placeholder-faint focus:outline-none"
        />
        <div className="max-h-[55vh] overflow-y-auto py-2">
          {flat.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-faint">No matches.</p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-1">
                <p className="px-5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
                  {g.label}
                </p>
                {g.items.map((c) => {
                  idx += 1;
                  const active = idx === hi;
                  return (
                    <button
                      key={`${c.type}-${c.label}-${idx}`}
                      onClick={() => select(c)}
                      onMouseEnter={() => setHi(idx)}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                        active ? "bg-gold/[0.12]" : "hover:bg-paper/[0.04]"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-paper">
                        {c.label}
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-faint">
                        {TYPE_LABEL[c.type]}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-hairline px-5 py-2 text-[10px] text-faint">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
