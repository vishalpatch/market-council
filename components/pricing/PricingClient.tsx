"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PLANS, FEATURE_ROWS, type PlanId, type Interval } from "@/lib/plans";

function priceLabel(planId: PlanId, interval: Interval) {
  const plan = PLANS.find((p) => p.id === planId)!;
  if (plan.priceMonthly === 0) return { big: "$0", sub: "forever" };
  if (interval === "yearly") {
    return { big: `$${plan.priceYearly}`, sub: "/year" };
  }
  return { big: `$${plan.priceMonthly}`, sub: "/month" };
}

export default function PricingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [err, setErr] = useState("");

  // Promo
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; description: string; kind: string } | null>(null);
  const [promoErr, setPromoErr] = useState("");
  const [applying, setApplying] = useState(false);

  const router = useRouter();

  async function choose(planId: PlanId) {
    setErr("");
    if (planId === "free") {
      router.push(isLoggedIn ? "/dashboard" : "/signup");
      return;
    }
    if (planId === "team") {
      window.location.href = "mailto:sales@marketcouncil.app?subject=Market%20Council%20Team%20plan";
      return;
    }
    if (!isLoggedIn) {
      router.push("/signup");
      return;
    }
    setBusy(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          interval,
          promoCode: promo?.kind === "percent" ? promo.code : "",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setErr(json.error ?? "Could not start checkout.");
        setBusy(null);
        return;
      }
      window.location.href = json.url;
    } catch {
      setErr("Network error. Please try again.");
      setBusy(null);
    }
  }

  async function validatePromo() {
    setPromoErr("");
    setPromo(null);
    const code = promoInput.trim();
    if (!code) return;
    const res = await fetch("/api/validate-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await res.json();
    if (!json.valid) {
      setPromoErr(json.error ?? "Invalid code.");
      return;
    }
    setPromo({ code: json.code, description: json.description, kind: json.kind });
  }

  async function applyFreePromo() {
    if (!promo) return;
    if (!isLoggedIn) {
      router.push("/signup");
      return;
    }
    setApplying(true);
    const res = await fetch("/api/apply-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promo.code }),
    });
    setApplying(false);
    if (res.ok) {
      window.location.href = "/dashboard?upgraded=true";
    } else {
      const json = await res.json();
      setPromoErr(json.error ?? "Could not apply code.");
    }
  }

  function cta(planId: PlanId) {
    if (planId === "free") return "Get Started Free";
    if (planId === "team") return "Contact Us";
    return "Start 7-Day Trial";
  }

  return (
    <div>
      {/* Interval toggle */}
      <div className="mb-12 flex items-center justify-center gap-3">
        <button
          onClick={() => setInterval("monthly")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            interval === "monthly" ? "bg-gold/[0.12] text-gold" : "text-muted hover:text-paper"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval("yearly")}
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            interval === "yearly" ? "bg-gold/[0.12] text-gold" : "text-muted hover:text-paper"
          }`}
        >
          Annual
          <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
            2 months free
          </span>
        </button>
      </div>

      {err && (
        <p className="mx-auto mb-6 max-w-md rounded-lg border border-down/30 bg-down/10 px-4 py-2.5 text-center text-sm text-down">
          {err}
        </p>
      )}

      {/* Plan cards */}
      <div className="grid gap-5 lg:grid-cols-5">
        {PLANS.map((plan) => {
          const price = priceLabel(plan.id, interval);
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.popular ? "border-gold/50 bg-gold/[0.05]" : "border-hairline bg-[var(--surface)]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
                  Most Popular
                </span>
              )}
              <h3 className="font-serif text-2xl font-light tracking-editorial">{plan.name}</h3>
              {plan.aiModel ? (
                <span className="mt-2 inline-block w-fit rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                  {plan.aiModel}
                </span>
              ) : (
                <span className="mt-2 inline-block w-fit text-[10px] font-semibold uppercase tracking-wider text-faint">
                  No AI
                </span>
              )}

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-light">{price.big}</span>
                <span className="text-sm text-muted">{price.sub}</span>
              </div>
              {plan.id === "team" && (
                <p className="mt-1 text-[11px] text-faint">Up to 10 seats · +$25/seat/mo</p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-muted">{plan.blurb}</p>

              <button
                onClick={() => choose(plan.id)}
                disabled={busy === plan.id}
                className={`mt-6 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  plan.popular || plan.id !== "free"
                    ? "bg-gold text-ink hover:bg-gold-soft"
                    : "border border-hairline-strong text-paper hover:border-gold hover:text-gold"
                }`}
              >
                {busy === plan.id ? "…" : cta(plan.id)}
              </button>

              {/* Full feature checklist */}
              <ul className="mt-6 space-y-2.5 border-t border-hairline pt-5 text-sm">
                {FEATURE_ROWS.map((row) => {
                  const v = row.values[plan.id];
                  return (
                    <li key={row.label} className="flex items-start gap-2">
                      {v === false ? (
                        <span className="mt-0.5 text-faint">✕</span>
                      ) : (
                        <span className="mt-0.5 text-gold">✓</span>
                      )}
                      <span className={v === false ? "text-faint" : "text-muted"}>
                        {typeof v === "string" && v !== "—" ? (
                          <>
                            {row.label}: <span className="text-paper">{v}</span>
                          </>
                        ) : (
                          row.label
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Promo */}
      <div className="mx-auto mt-14 max-w-md text-center">
        {!promoOpen ? (
          <button
            onClick={() => setPromoOpen(true)}
            className="text-sm text-muted underline-offset-4 hover:text-gold hover:underline"
          >
            Have a promo code?
          </button>
        ) : (
          <div className="rounded-2xl border border-hairline bg-[var(--surface)] p-5 text-left">
            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="flex-1 rounded-xl border border-[var(--edge)] bg-[var(--surface-2)] px-4 py-2.5 font-mono text-sm text-paper placeholder-faint focus:border-gold/50 focus:outline-none"
              />
              <button
                onClick={validatePromo}
                className="rounded-xl border border-hairline-strong px-4 py-2.5 text-sm font-semibold text-paper hover:border-gold hover:text-gold"
              >
                Check
              </button>
            </div>
            {promoErr && <p className="mt-3 text-xs text-down">{promoErr}</p>}
            {promo && (
              <div className="mt-4 rounded-xl border border-gold/30 bg-gold/[0.06] p-4">
                <p className="text-sm text-paper">
                  <span className="font-mono font-semibold text-gold">{promo.code}</span> —{" "}
                  {promo.description}
                </p>
                {promo.kind === "free_upgrade" ? (
                  <button
                    onClick={applyFreePromo}
                    disabled={applying}
                    className="mt-3 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-soft disabled:opacity-50"
                  >
                    {applying ? "Applying…" : "Apply now"}
                  </button>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    This discount will be applied automatically at checkout.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-10 text-center text-xs text-faint">
        All paid plans start with a 7-day free trial. Cancel anytime.{" "}
        <Link href="/dashboard" className="text-gold hover:text-gold-soft">
          Manage billing
        </Link>
      </p>
    </div>
  );
}
