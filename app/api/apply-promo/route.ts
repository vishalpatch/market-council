import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, type PlanId } from "@/lib/plans";
import {
  promoStatus,
  isFreeUpgradePromo,
  grantedPlan,
  type PromoRow,
} from "@/lib/promo";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

const DAY = 86400000;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }
    const body = await req.json();
    const code = sanitizeText(body?.code, 40).toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Enter a code." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .maybeSingle();
    const promo = data as PromoRow | null;
    if (!promo) {
      return NextResponse.json({ error: "That code doesn't exist." }, { status: 404 });
    }
    const status = promoStatus(promo);
    if (!status.valid) {
      return NextResponse.json({ error: status.reason }, { status: 400 });
    }
    if (!isFreeUpgradePromo(promo)) {
      return NextResponse.json(
        { error: "This code is applied at checkout, not directly." },
        { status: 400 }
      );
    }

    const plan = grantedPlan(promo) as PlanId;
    const p = getPlan(plan);
    const periodEnd =
      promo.discount_type === "free_lifetime"
        ? new Date(Date.now() + 100 * 365 * DAY)
        : new Date(Date.now() + (promo.discount_value || 30) * DAY);

    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        ai_model: p.aiModel,
        monthly_ai_limit: p.limits.committee,
      },
      { onConflict: "user_id" }
    );
    await admin
      .from("promo_codes")
      .update({ uses_so_far: promo.uses_so_far + 1 })
      .eq("id", promo.id);

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("[apply-promo] error:", err);
    return NextResponse.json({ error: "Could not apply code." }, { status: 500 });
  }
}
