import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Resend } from "resend";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";

// Next needs the raw body for Stripe signature verification.
async function writeSubscription(params: {
  userId: string;
  plan: PlanId;
  status: string;
  customerId: string | null;
  subscriptionId: string | null;
  periodEnd: number | null;
}) {
  const admin = createAdminClient();
  const plan = getPlan(params.plan);
  await admin.from("subscriptions").upsert(
    {
      user_id: params.userId,
      plan: params.plan,
      status: params.status,
      stripe_customer_id: params.customerId,
      stripe_subscription_id: params.subscriptionId,
      current_period_end: params.periodEnd
        ? new Date(params.periodEnd * 1000).toISOString()
        : null,
      ai_model: plan.aiModel,
      monthly_ai_limit: plan.limits.committee,
    },
    { onConflict: "user_id" }
  );
}

function planFromMetadata(meta: Stripe.Metadata | null | undefined): PlanId {
  const p = meta?.plan;
  if (p === "starter" || p === "pro" || p === "analyst" || p === "team") return p;
  return "free";
}

// Stripe moved current_period_end onto subscription items in recent API
// versions; read from either location.
function periodEndOf(sub: Stripe.Subscription): number | null {
  const item = sub.items?.data?.[0] as { current_period_end?: number } | undefined;
  if (item?.current_period_end) return item.current_period_end;
  const legacy = sub as unknown as { current_period_end?: number };
  return legacy.current_period_end ?? null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) {
    return NextResponse.json({ error: "Missing webhook secret/signature." }, { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 });
  }

  try {
    const stripe = getStripe();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = planFromMetadata(session.metadata);
        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await writeSubscription({
            userId,
            plan,
            status: sub.status,
            customerId: (session.customer as string) ?? null,
            subscriptionId: sub.id,
            periodEnd: periodEndOf(sub),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          await writeSubscription({
            userId,
            plan: planFromMetadata(sub.metadata),
            status: sub.status,
            customerId: (sub.customer as string) ?? null,
            subscriptionId: sub.id,
            periodEnd: periodEndOf(sub),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (userId) {
          await writeSubscription({
            userId,
            plan: "free",
            status: "canceled",
            customerId: (sub.customer as string) ?? null,
            subscriptionId: null,
            periodEnd: null,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const admin = createAdminClient();
        const customerId = invoice.customer as string;
        const { data } = await admin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (data?.user_id) {
          await admin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("user_id", data.user_id);
          // Notify via Resend (best-effort).
          const key = process.env.RESEND_API_KEY;
          if (key && invoice.customer_email) {
            try {
              await new Resend(key).emails.send({
                from: process.env.RESEND_FROM ?? "Market Council <onboarding@resend.dev>",
                to: invoice.customer_email,
                subject: "Your Market Council payment failed",
                html: `<div style="font-family:Arial,sans-serif;background:#100e0b;color:#ece6d9;padding:24px;border-radius:12px;"><h2 style="color:#c8a45d;font-family:Georgia,serif;">Payment failed</h2><p>We couldn't process your latest Market Council payment, so your subscription is marked past due. Please update your payment method to keep your plan active.</p></div>`,
              });
            } catch {
              /* ignore */
            }
          }
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }
}
