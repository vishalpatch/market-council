"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const KEY = "mc_onboarding_done";

interface Step {
  label: string;
  href: string;
  done: boolean;
}

export default function OnboardingChecklist() {
  const [state, setState] = useState<"loading" | "hidden" | "show" | "allset">("loading");
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) {
        setState("hidden");
        return;
      }
    } catch {
      /* ignore */
    }
    (async () => {
      const supabase = createClient();
      const [w, c, j] = await Promise.all([
        supabase.from("watchlist_items").select("*", { count: "exact", head: true }),
        supabase.from("committee_analyses").select("*", { count: "exact", head: true }),
        supabase.from("journal_entries").select("*", { count: "exact", head: true }),
      ]);
      const s: Step[] = [
        { label: "Add your first ticker to your Watchlist", href: "/dashboard#watchlist", done: (w.count ?? 0) > 0 },
        { label: "Run your first Committee analysis", href: "/dashboard/committee", done: (c.count ?? 0) > 0 },
        { label: "Log your first Journal entry", href: "/dashboard/journal", done: (j.count ?? 0) > 0 },
      ];
      setSteps(s);
      if (s.every((x) => x.done)) {
        try {
          localStorage.setItem(KEY, "1");
        } catch {
          /* ignore */
        }
        setState("allset");
        setTimeout(() => setState("hidden"), 5000);
      } else {
        setState("show");
      }
    })();
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setState("hidden");
  }

  if (state === "loading" || state === "hidden") return null;

  if (state === "allset") {
    return (
      <div className="mb-12 rounded-2xl border border-gold/30 bg-gold/[0.06] p-6 text-center">
        <p className="font-serif text-2xl font-light text-gold">You&apos;re all set.</p>
        <p className="mt-1 text-sm text-muted">
          Your council is fully at your command. Happy hunting.
        </p>
      </div>
    );
  }

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="mb-12 rounded-2xl border border-hairline bg-[var(--surface)] p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Getting started</p>
          <h2 className="mt-1 font-serif text-2xl font-light tracking-editorial">
            Three steps to get going
          </h2>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-faint transition-colors hover:text-paper"
        >
          ✕
        </button>
      </div>

      {/* Progress */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <span className="font-mono text-xs text-muted">{doneCount}/{steps.length}</span>
      </div>

      <div className="space-y-1">
        {steps.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-paper/[0.04]"
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                s.done ? "border-gold bg-gold text-ink" : "border-hairline-strong text-transparent"
              }`}
            >
              ✓
            </span>
            <span
              className={`flex-1 text-sm ${
                s.done ? "text-faint line-through" : "text-paper"
              }`}
            >
              {s.label}
            </span>
            {!s.done && (
              <span className="text-faint transition-colors group-hover:text-gold">→</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
