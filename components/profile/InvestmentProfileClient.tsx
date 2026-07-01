"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/Spinner";

interface Profile {
  enough: boolean;
  style?: { label: string; blurb: string };
  risk?: { label: string; blurb: string };
  sector?: { label: string; share: number } | null;
  decisionSpeed?: { label: string; blurb: string };
  insights?: string[];
  stats?: {
    analyses: number;
    trades: number;
    tracked: number;
    avgConviction: number;
    bullPct: number | null;
  };
  error?: string;
}

export default function InvestmentProfileClient() {
  const [data, setData] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/investment-profile");
        const json = (await res.json()) as Profile;
        if (!res.ok) {
          setError(json.error ?? "Failed to build your profile.");
          return;
        }
        setData(json);
      } catch {
        setError("Network error. Please try again.");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10 px-5 py-4 text-sm text-[#cb7e68]">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data.enough) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ece6d9]/[0.14] bg-[#ece6d9]/[0.02] p-12 text-center">
        <h2 className="mb-3 font-serif text-2xl font-light">Not enough signal yet</h2>
        <p className="mx-auto mb-8 max-w-md text-pretty leading-relaxed text-muted">
          Your profile is inferred entirely from how you use Market Council — the
          theses you run, the trades you log, the names you watch, the portfolios you
          stress-test. Use the app a little more and a picture will emerge here.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/committee" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft">
            Run an analysis
          </Link>
          <Link href="/dashboard/journal" className="rounded-full border border-hairline-strong px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:border-gold hover:text-gold">
            Log a trade
          </Link>
        </div>
      </div>
    );
  }

  const { style, risk, sector, decisionSpeed, insights, stats } = data;

  return (
    <div className="space-y-10">
      {/* Hero profile card */}
      <div className="overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/[0.08] via-[#ece6d9]/[0.02] to-transparent p-8 sm:p-10">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold">Your investing style</p>
        <h2 className="font-serif text-5xl font-light tracking-editorial text-paper sm:text-6xl">
          The {style?.label}
        </h2>
        <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">{style?.blurb}</p>

        <div className="mt-8 grid gap-px sm:grid-cols-3">
          <Attribute label="Risk appetite" value={risk?.label ?? "—"} sub={risk?.blurb} />
          <Attribute
            label="Sector bias"
            value={sector ? sector.label : "Diversified"}
            sub={sector ? `${sector.share}% of names you follow` : "No clear tilt"}
          />
          <Attribute
            label="Decision speed"
            value={decisionSpeed?.label ?? "—"}
            sub={decisionSpeed?.blurb}
          />
        </div>
      </div>

      {/* Behavioral insights */}
      <section>
        <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-faint">
          What your behavior says
        </h3>
        <div className="space-y-3">
          {insights?.map((t, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-2xl border border-[#ece6d9]/[0.08] bg-[#ece6d9]/[0.02] p-5"
            >
              <span className="font-serif text-2xl font-light text-gold">{i + 1}</span>
              <p className="self-center text-pretty leading-relaxed text-zinc-300">{t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats footer */}
      <div className="grid grid-cols-2 gap-px border-t border-hairline pt-6 sm:grid-cols-4">
        <MiniStat label="Analyses" value={String(stats?.analyses ?? 0)} />
        <MiniStat label="Trades logged" value={String(stats?.trades ?? 0)} />
        <MiniStat label="Names tracked" value={String(stats?.tracked ?? 0)} />
        <MiniStat label="Avg conviction" value={`${stats?.avgConviction ?? 0}/100`} />
      </div>

      <p className="text-[11px] text-faint">
        Inferred from your usage and updates automatically as you do more. For
        informational purposes only — not financial advice.
      </p>
    </div>
  );
}

function Attribute({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-t border-hairline pt-5 sm:border-t-0 sm:border-l sm:pl-6 sm:pt-0 sm:first:border-l-0 sm:first:pl-0">
      <p className="text-xs uppercase tracking-[0.15em] text-faint">{label}</p>
      <p className="mt-2 font-serif text-2xl font-light text-paper">{value}</p>
      {sub && <p className="mt-1 text-xs leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="sm:pr-6">
      <p className="text-xs uppercase tracking-[0.15em] text-faint">{label}</p>
      <p className="mt-1 font-serif text-2xl font-light">{value}</p>
    </div>
  );
}
