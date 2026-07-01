import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const teamId = String(body?.teamId ?? "");
  const email = sanitizeText(body?.email, 160).toLowerCase();
  if (!teamId || !email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || (membership.role !== "owner" && membership.role !== "manager")) {
    return NextResponse.json({ error: "Only owners and managers can invite." }, { status: 403 });
  }

  const { data: team } = await admin.from("teams").select("name, seat_count").eq("id", teamId).single();
  const { count } = await admin
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", teamId);
  if ((count ?? 0) >= (team?.seat_count ?? 10)) {
    return NextResponse.json({ error: "All seats are taken. Add more seats to invite." }, { status: 400 });
  }

  // If the invitee already has an account, add them straight away.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users.find((u) => u.email?.toLowerCase() === email);
  let added = false;
  if (existing) {
    const { error } = await admin
      .from("team_members")
      .upsert(
        { team_id: teamId, user_id: existing.id, role: "member" },
        { onConflict: "team_id,user_id" }
      );
    if (!error) added = true;
  }

  // Send the invite email (best-effort).
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    try {
      await new Resend(key).emails.send({
        from: process.env.RESEND_FROM ?? "Market Council <onboarding@resend.dev>",
        to: email,
        subject: `You've been invited to ${team?.name ?? "a team"} on Market Council`,
        html: `<div style="font-family:Arial,sans-serif;background:#100e0b;color:#ece6d9;padding:24px;border-radius:12px;">
          <h2 style="color:#c8a45d;font-family:Georgia,serif;">You're on the team</h2>
          <p>You've been added to <strong>${team?.name ?? "a team"}</strong> on Market Council.</p>
          <p><a href="${site}/dashboard/team" style="color:#c8a45d;">Open the team workspace →</a></p>
        </div>`,
      });
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ ok: true, added });
}
