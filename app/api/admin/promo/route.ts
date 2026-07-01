import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/is-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

const TYPES = ["percent_forever", "percent_months", "free_days", "free_lifetime"];

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const body = await req.json();
  const code = sanitizeText(body?.code, 40).toUpperCase().replace(/\s/g, "");
  const discountType = String(body?.discountType);
  const discountValue = Number(body?.discountValue) || 0;
  const appliesToPlans = Array.isArray(body?.appliesToPlans)
    ? (body.appliesToPlans as unknown[]).map(String).slice(0, 5)
    : [];
  const maxUses = body?.maxUses ? Number(body.maxUses) : null;
  const expiresAt = typeof body?.expiresAt === "string" && body.expiresAt ? body.expiresAt : null;

  if (!code) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }
  if (!TYPES.includes(discountType)) {
    return NextResponse.json({ error: "Invalid discount type." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("promo_codes").insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    applies_to_plans: appliesToPlans,
    max_uses: maxUses,
    expires_at: expiresAt,
    active: true,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const body = await req.json();
  const id = String(body?.id ?? "");
  const active = Boolean(body?.active);
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("promo_codes").update({ active }).eq("id", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const body = await req.json();
  const id = String(body?.id ?? "");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("promo_codes").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
