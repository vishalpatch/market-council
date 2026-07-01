import { createClient } from "@/lib/supabase/server";
import { getPlan, type AIFeature } from "@/lib/plans";

export interface UsageCheck {
  allowed: boolean;
  used: number;
  limit: number | null;
  plan: string;
  aiModel: string | null;
  reason?: "free" | "limit";
}

const ALL_FEATURES: AIFeature[] = ["committee", "devils_advocate", "market_pulse"];

/** Start of the current billing month (UTC), as ISO string. */
function periodStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

async function planIdForUser(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .maybeSingle();
  if (!data || data.status === "canceled") return "free";
  return data.plan ?? "free";
}

export async function checkAIUsage(
  userId: string,
  feature: AIFeature
): Promise<UsageCheck> {
  const planId = await planIdForUser();
  const plan = getPlan(planId);
  const limit = plan.limits[feature];

  if (limit === null) {
    return { allowed: true, used: 0, limit: null, plan: planId, aiModel: plan.aiModel };
  }
  if (limit === 0) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      plan: planId,
      aiModel: plan.aiModel,
      reason: "free",
    };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("feature", feature)
    .gte("period_start", periodStart());
  const used = count ?? 0;

  return {
    allowed: used < limit,
    used,
    limit,
    plan: planId,
    aiModel: plan.aiModel,
    reason: used < limit ? undefined : "limit",
  };
}

export async function recordAIUsage(userId: string, feature: AIFeature): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("ai_usage")
    .insert({ user_id: userId, feature, period_start: periodStart() });
}

export interface UsageSnapshot {
  plan: string;
  aiModel: string | null;
  features: Record<AIFeature, { used: number; limit: number | null }>;
}

export async function usageSnapshot(): Promise<UsageSnapshot> {
  const planId = await planIdForUser();
  const plan = getPlan(planId);
  const supabase = await createClient();
  const start = periodStart();

  const features = {} as Record<AIFeature, { used: number; limit: number | null }>;
  for (const f of ALL_FEATURES) {
    const limit = plan.limits[f];
    let used = 0;
    if (limit !== null && limit !== 0) {
      const { count } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("feature", f)
        .gte("period_start", start);
      used = count ?? 0;
    }
    features[f] = { used, limit };
  }

  return { plan: planId, aiModel: plan.aiModel, features };
}
