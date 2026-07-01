// Client-safe plan/pricing config — the single source of truth for pricing,
// usage limits, the usage meter, and checkout. No secrets here.

export type PlanId = "free" | "starter" | "pro" | "analyst" | "team";
export type AIFeature = "committee" | "devils_advocate" | "market_pulse";
export type Interval = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  aiModel: string | null;
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
  blurb: string;
  /** Monthly limits per AI feature. null = unlimited, 0 = not included. */
  limits: Record<AIFeature, number | null>;
  seats?: number;
  extraSeatPrice?: number;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    aiModel: null,
    priceMonthly: 0,
    priceYearly: 0,
    blurb: "Every data tool, unlimited. No AI features.",
    limits: { committee: 0, devils_advocate: 0, market_pulse: 0 },
  },
  {
    id: "starter",
    name: "Starter",
    aiModel: "Council AI",
    priceMonthly: 10,
    priceYearly: 100,
    blurb: "AI for the individual investor.",
    limits: { committee: 15, devils_advocate: 15, market_pulse: 30 },
  },
  {
    id: "pro",
    name: "Pro",
    aiModel: "Verdict AI",
    priceMonthly: 49,
    priceYearly: 490,
    popular: true,
    blurb: "Serious research firepower.",
    limits: { committee: 100, devils_advocate: 100, market_pulse: null },
  },
  {
    id: "analyst",
    name: "Analyst",
    aiModel: "Boardroom AI",
    priceMonthly: 99,
    priceYearly: 990,
    blurb: "Unlimited everything, early access.",
    limits: { committee: null, devils_advocate: null, market_pulse: null },
  },
  {
    id: "team",
    name: "Team",
    aiModel: "Boardroom AI",
    priceMonthly: 299,
    priceYearly: 2990,
    blurb: "Analyst for your whole desk.",
    limits: { committee: null, devils_advocate: null, market_pulse: null },
    seats: 10,
    extraSeatPrice: 25,
  },
];

const BY_ID: Record<PlanId, Plan> = PLANS.reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {} as Record<PlanId, Plan>
);

export function getPlan(id: string | null | undefined): Plan {
  return BY_ID[(id as PlanId) ?? "free"] ?? BY_ID.free;
}

export function limitFor(planId: string, feature: AIFeature): number | null {
  return getPlan(planId).limits[feature];
}

/** Pricing checkboxes matrix. Values: true/false/string per plan. */
export const FEATURE_ROWS: { label: string; values: Record<PlanId, boolean | string> }[] = [
  {
    label: "All data tools (Watchlist, Journal, Explorer, Calendar, Risk, Stress Test)",
    values: { free: true, starter: true, pro: true, analyst: true, team: true },
  },
  {
    label: "AI model",
    values: { free: "—", starter: "Council AI", pro: "Verdict AI", analyst: "Boardroom AI", team: "Boardroom AI" },
  },
  {
    label: "Committee analyses / month",
    values: { free: "—", starter: "15", pro: "100", analyst: "Unlimited", team: "Unlimited" },
  },
  {
    label: "Devil's Advocate debates / month",
    values: { free: "—", starter: "15", pro: "100", analyst: "Unlimited", team: "Unlimited" },
  },
  {
    label: "Market Pulse checks / month",
    values: { free: "—", starter: "30", pro: "Unlimited", analyst: "Unlimited", team: "Unlimited" },
  },
  {
    label: "PDF export",
    values: { free: false, starter: true, pro: true, analyst: true, team: true },
  },
  {
    label: "Email notifications",
    values: { free: false, starter: false, pro: true, analyst: true, team: true },
  },
  {
    label: "CSV export",
    values: { free: false, starter: false, pro: true, analyst: true, team: true },
  },
  {
    label: "Early access to new features",
    values: { free: false, starter: false, pro: false, analyst: true, team: true },
  },
  {
    label: "Team seats & collaboration",
    values: { free: false, starter: false, pro: false, analyst: false, team: "Up to 10 seats" },
  },
];

export const FEATURE_LABEL: Record<AIFeature, string> = {
  committee: "Committee",
  devils_advocate: "Devil's Advocate",
  market_pulse: "Market Pulse",
};

/** Server-only: resolve the Stripe price id env var for a plan + interval. */
export function priceEnvKey(plan: PlanId, interval: Interval): string {
  return `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
}
