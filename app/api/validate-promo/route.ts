import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  promoStatus,
  promoDescription,
  promoValidForPlan,
  isPercentPromo,
  isFreeUpgradePromo,
  grantedPlan,
  type PromoRow,
} from "@/lib/promo";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = sanitizeText(body?.code, 40).toUpperCase();
    const plan = typeof body?.plan === "string" ? body.plan : undefined;
    if (!code) {
      return NextResponse.json({ valid: false, error: "Enter a code." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .maybeSingle();
    const promo = data as PromoRow | null;

    if (!promo) {
      return NextResponse.json({ valid: false, error: "That code doesn't exist." });
    }
    const status = promoStatus(promo);
    if (!status.valid) {
      return NextResponse.json({ valid: false, error: status.reason });
    }
    if (plan && !promoValidForPlan(promo, plan)) {
      return NextResponse.json({
        valid: false,
        error: "This code doesn't apply to that plan.",
      });
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      description: promoDescription(promo),
      kind: isFreeUpgradePromo(promo) ? "free_upgrade" : isPercentPromo(promo) ? "percent" : "other",
      grantsPlan: isFreeUpgradePromo(promo) ? grantedPlan(promo) : null,
    });
  } catch (err) {
    console.error("[validate-promo] error:", err);
    return NextResponse.json({ valid: false, error: "Could not validate code." }, { status: 500 });
  }
}
