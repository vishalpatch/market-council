// Shared promo-code logic (client-safe: no secrets).

export type DiscountType =
  | "percent_forever"
  | "percent_months"
  | "free_days"
  | "free_lifetime";

export interface PromoRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  applies_to_plans: string[];
  max_uses: number | null;
  uses_so_far: number;
  expires_at: string | null;
  active: boolean;
}

export const DISCOUNT_TYPE_OPTIONS: { value: DiscountType; label: string }[] = [
  { value: "percent_forever", label: "Percentage off forever" },
  { value: "percent_months", label: "Percentage off for 3 months" },
  { value: "free_days", label: "Free plan upgrade for N days" },
  { value: "free_lifetime", label: "Lifetime free plan upgrade" },
];

export function promoStatus(p: PromoRow): { valid: boolean; reason?: string } {
  if (!p.active) return { valid: false, reason: "This code is no longer active." };
  if (p.expires_at && new Date(p.expires_at) < new Date())
    return { valid: false, reason: "This code has expired." };
  if (p.max_uses != null && p.uses_so_far >= p.max_uses)
    return { valid: false, reason: "This code has reached its usage limit." };
  return { valid: true };
}

export function isPercentPromo(p: PromoRow): boolean {
  return p.discount_type === "percent_forever" || p.discount_type === "percent_months";
}

export function isFreeUpgradePromo(p: PromoRow): boolean {
  return p.discount_type === "free_days" || p.discount_type === "free_lifetime";
}

export function promoValidForPlan(p: PromoRow, plan: string): boolean {
  return p.applies_to_plans.length === 0 || p.applies_to_plans.includes(plan);
}

/** For free-upgrade promos, the plan they grant (first entry, defaults to pro). */
export function grantedPlan(p: PromoRow): string {
  return p.applies_to_plans[0] ?? "pro";
}

export function promoDescription(p: PromoRow): string {
  switch (p.discount_type) {
    case "percent_forever":
      return `${p.discount_value}% off for as long as you stay subscribed`;
    case "percent_months":
      return `${p.discount_value}% off for your first 3 months`;
    case "free_days":
      return `${p.discount_value} days of free ${grantedPlan(p)} access`;
    case "free_lifetime":
      return `Lifetime free ${grantedPlan(p)} access`;
    default:
      return "Discount";
  }
}
