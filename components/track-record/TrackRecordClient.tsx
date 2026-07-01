"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/Spinner";
import VerdictBadge from "@/components/committee/VerdictBadge";
import { formatPrice } from "@/lib/format";
import type { Verdict } from "@/lib/committee-types";

interface Snapshot {
  id: string;
  ticker: string;
  price_at_submission: number;
  submitted_at: string;
  committee_analyses: { thesis: string; result: { chairman?: { verdict?: Verdict } } } | null;
}

interface Resolved extends Snapshot {
  currentPrice: number | null;
  movePct: number | null;
  daysSince: number;
  status: "on-track" | "off-track" | "flat" | "unknown";
}

const MILESTONES = [30, 60, 90];

function evaluate(verdict: Verdict | undefined, movePct: number | null): Resolved["status"] {
  if (movePct === null) return "unknown";
  if (Math.abs(movePct) < 1.5) return "flat";
  if (verdict === "BULLISH") return movePct > 0 ? "on-track" : "off-track";
  if (verdict === "BEARISH") return movePct < 0 ? "on-track" : "off-track";
  return "flat";
}

const STATUS_META: Record<Resolved["status"], { label: string; color: string }> = {
  "on-track": { label: "Playing out", color: "#7ba890" },
  "off-track": { label: "Not yet", color: "#cb7e68" },
  flat: { label: "Flat", color: "#9b9486" },
  unknown: { label: "No price", color: "#6c665b" },
};

export default function TrackRecordClient() {
  const [rows, setRows] = useState<Resolved[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from("track_record_snapshots")
        .select("id, ticker, price_at_submission, submitted_at, committee_analyses(thesis, result)")
        .order("submitted_at", { ascending: false });

      if (dbErr) {
        setError(dbErr.message);
        return;
      }

      const snaps = (data as unknown as Snapshot[]) ?? [];
      const resolved = await Promise.all(
        snaps.map(async (s): Promise<Resolved> => {
          let currentPrice: number | null = null;
          try {
            const res = await fetch(`/api/stock/${s.ticker}`);
            if (res.ok) {
              const json = await res.json();
              currentPrice = json.quote?.price ?? null;
            }
          } catch {
            /* leave null */
          }
          const movePct =
            currentPrice != null && s.price_at_submission
              ? ((currentPrice - s.price_at_submission) / s.price_at_submission) * 100
              : null;
          const daysSince = Math.max(
            0,
            Math.floor((Date.now() - new Date(s.submitted_at).getTime()) / 86400000)
          );
          return {
            ...s,
            currentPrice,
            movePct,
            daysSince,
            status: evaluate(s.committee_analyses?.result?.chairman?.verdict, movePct),
          };
        })
      );
      setRows(resolved);
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10 px-5 py-4 text-sm text-[#cb7e68]">
        {error}
      </div>
    );
  }
  if (!rows) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece6d9]/[0.14] bg-[#ece6d9]/[0.02] p-12 text-center">
        <h2 className="mb-3 font-serif text-2xl font-light">No theses tracked yet</h2>
        <p className="mx-auto mb-8 max-w-md text-pretty leading-relaxed text-muted">
          Every time you save a committee analysis with a ticker in it, we snapshot the
          price and start tracking how the thesis plays out over 30, 60, and 90 days.
        </p>
        <Link href="/dashboard/committee" className="inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft">
          Convene the committee
        </Link>
      </div>
    );
  }

  const directional = rows.filter((r) => r.status === "on-track" || r.status === "off-track");
  const onTrack = rows.filter((r) => r.status === "on-track").length;
  const accuracy = directional.length
    ? Math.round((onTrack / directional.length) * 100)
    : null;

  return (
    <div className="space-y-10">
      {/* Accuracy score */}
      <div className="grid grid-cols-2 gap-px sm:grid-cols-4">
        <div className="border-t border-hairline pt-5 sm:pr-6">
          <p className="text-xs uppercase tracking-[0.15em] text-faint">Accuracy</p>
          <p className="mt-2 font-serif text-4xl font-light text-gold">
            {accuracy === null ? "—" : `${accuracy}%`}
          </p>
          <p className="mt-1 text-xs text-muted">
            {accuracy === null ? "Awaiting moves" : `${onTrack}/${directional.length} playing out`}
          </p>
        </div>
        <div className="border-t border-hairline pt-5 sm:pr-6">
          <p className="text-xs uppercase tracking-[0.15em] text-faint">Theses tracked</p>
          <p className="mt-2 font-serif text-4xl font-light">{rows.length}</p>
        </div>
      </div>

      {/* Tracked theses */}
      <div className="space-y-4">
        {rows.map((r) => {
          const meta = STATUS_META[r.status];
          const up = (r.movePct ?? 0) >= 0;
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] p-5 backdrop-blur-xl"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="font-mono text-base font-bold text-paper">{r.ticker}</span>
                {r.committee_analyses?.result?.chairman?.verdict && (
                  <VerdictBadge verdict={r.committee_analyses.result.chairman.verdict} size="sm" />
                )}
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: meta.color, backgroundColor: `${meta.color}1a`, border: `1px solid ${meta.color}55` }}
                >
                  {meta.label}
                </span>
                <span className="ml-auto text-xs text-faint">
                  {new Date(r.submitted_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {r.committee_analyses?.thesis && (
                <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-300">
                  {r.committee_analyses.thesis}
                </p>
              )}

              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <Metric label="At submission" value={formatPrice(r.price_at_submission)} />
                <Metric
                  label="Now"
                  value={r.currentPrice != null ? formatPrice(r.currentPrice) : "—"}
                />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-faint">Move</p>
                  <p
                    className="mt-1 font-mono text-lg"
                    style={{ color: r.movePct == null ? "#9b9486" : up ? "#7ba890" : "#cb7e68" }}
                  >
                    {r.movePct == null ? "—" : `${up ? "+" : ""}${r.movePct.toFixed(1)}%`}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  {MILESTONES.map((m) => (
                    <span
                      key={m}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${
                        r.daysSince >= m
                          ? "border-gold/40 bg-gold/10 text-gold"
                          : "border-hairline text-faint"
                      }`}
                    >
                      {m}d
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-faint">
        Prices via Finnhub. Milestone chips light up as each window elapses. For
        informational purposes only — not financial advice.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-1 font-mono text-lg text-paper">{value}</p>
    </div>
  );
}
