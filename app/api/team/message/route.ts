import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeText } from "@/lib/sanitize";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const teamId = String(body?.teamId ?? "");
  const content = sanitizeText(body?.content, 2000);
  const wantsPinned = Boolean(body?.pinned);
  if (!teamId || !content) {
    return NextResponse.json({ error: "Message and team are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this team." }, { status: 403 });
  }

  // Only owners/managers can pin announcements.
  const pinned = wantsPinned && (membership.role === "owner" || membership.role === "manager");

  const { error } = await admin
    .from("team_messages")
    .insert({ team_id: teamId, user_id: user.id, content, pinned });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
