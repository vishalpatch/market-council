import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSessionUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceEnvKey, type PlanId, type Interval } from "@/lib/plans";
import {
  promoStatus,
  isPercentPromo,
  promoValidForPlan,
  type PromoRow,
} from "@/lib/promo";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

const PAID: PlanId[] = ["starter", "pro", "analyst", "team"];

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const body = await req.json();
    const plan = body?.plan as PlanId;
    const interval: Interval = body?.interval === "yearly" ? "yearly" : "monthly";
    const promoCode = sanitizeText(body?.promoCode, 40).toUpperCase();

    if (!PAID.includes(plan)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }
    const priceId = process.env[priceEnvKey(plan, interval)];
    if (!priceId) {
      return NextResponse.json(
        { error: "This plan isn't available for checkout yet." },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const admin = createAdminClient();

    // Get or create the Stripe customer.
    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    let customerId = sub?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from("subscriptions")
        .upsert(
          { user_id: user.id, stripe_customer_id: customerId, plan: "free", status: "active" },
          { onConflict: "user_id" }
        );
    }

    // Percentage promo → one-off Stripe coupon.
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (promoCode) {
      const { data } = await admin
        .from("promo_codes")
        .select("*")
        .ilike("code", promoCode)
        .maybeSingle();
      const promo = data as PromoRow | null;
      if (
        promo &&
        promoStatus(promo).valid &&
        isPercentPromo(promo) &&
        promoValidForPlan(promo, plan)
      ) {
        const coupon = await stripe.coupons.create({
          percent_off: promo.discount_value,
          duration: promo.discount_type === "percent_months" ? "repeating" : "forever",
          ...(promo.discount_type === "percent_months" ? { duration_in_months: 3 } : {}),
          name: `Promo ${promo.code}`,
        });
        discounts = [{ coupon: coupon.id }];
        await admin
          .from("promo_codes")
          .update({ uses_so_far: promo.uses_so_far + 1 })
          .eq("id", promo.id);
      }
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7, metadata: { user_id: user.id, plan } },
      metadata: { user_id: user.id, plan },
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      success_url: `${site}/dashboard?upgraded=true`,
      cancel_url: `${site}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
