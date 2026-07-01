"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlan, FEATURE_LABEL, type AIFeature } from "@/lib/plans";

interface Snapshot {
  plan: string;
  aiModel: string | null;
  features: Record<AIFeature, { used: number; limit: number | null }>;
}

function Bar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const warn = pct >= 80;
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: warn ? "#cb7e68" : "#c8a45d" }}
      />
    </div>
  );
}

export default function UsageMeter() {
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) setData((await res.json()) as Snapshot);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!data) return null;

  const plan = getPlan(data.plan);
  const limited: AIFeature[] = (["committee", "devils_advocate"] as AIFeature[]).filter(
    (f) => data.features[f]?.limit !== null && data.features[f]?.limit !== 0
  );
  const unlimited = plan.id !== "free" && limited.length === 0;

  return (
    // Only meaningful when expanded; collapses to nothing when the rail is thin.
    <div className="mt-3 overflow-hidden border-t border-hairline/60 px-1 pt-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
          {plan.name} plan
        </span>
        {plan.id !== "analyst" && plan.id !== "team" && (
          <Link href="/pricing" className="text-[10px] font-semibold text-gold hover:text-gold-soft">
            Upgrade
          </Link>
        )}
      </div>

      {plan.id === "free" && (
        <p className="text-[11px] leading-snug text-muted">
          Data tools unlimited. <Link href="/pricing" className="text-gold">Add AI →</Link>
        </p>
      )}

      {unlimited && (
        <p className="text-[11px] text-muted">
          <span className="text-paper">Unlimited</span> · {data.aiModel}
        </p>
      )}

      {limited.map((f) => {
        const u = data.features[f];
        return (
          <div key={f} className="mb-2">
            <div className="flex items-center justify-between text-[10px] text-muted">
              <span>{FEATURE_LABEL[f]}</span>
              <span className="font-mono">
                {u.used}/{u.limit}
              </span>
            </div>
            <Bar used={u.used} limit={u.limit ?? 1} />
          </div>
        );
      })}
    </div>
  );
}
