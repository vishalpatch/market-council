import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id);
  let teamId = memberships?.[0]?.team_id ?? null;
  let myRole: string | null = memberships?.[0]?.role ?? null;

  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();
  const isTeamPlan = sub?.plan === "team";

  // Auto-provision a team for a Team-plan owner who doesn't have one yet.
  if (!teamId && isTeamPlan) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const ownerName = typeof meta.full_name === "string" ? meta.full_name : null;
    const { data: team } = await admin
      .from("teams")
      .insert({
        name: ownerName ? `${ownerName}'s Team` : "My Team",
        owner_user_id: user.id,
        seat_count: 10,
      })
      .select("id")
      .single();
    if (team) {
      await admin.from("team_members").insert({ team_id: team.id, user_id: user.id, role: "owner" });
      teamId = team.id;
      myRole = "owner";
    }
  }

  if (!teamId) {
    return NextResponse.json({ hasTeam: false, isTeamPlan });
  }

  const { data: team } = await admin
    .from("teams")
    .select("id, name, seat_count")
    .eq("id", teamId)
    .single();
  const { data: members } = await admin
    .from("team_members")
    .select("user_id, role, joined_at")
    .eq("team_id", teamId);

  const enriched = await Promise.all(
    (members ?? []).map(async (m) => {
      const { data: u } = await admin.auth.admin.getUserById(m.user_id);
      const meta = (u?.user?.user_metadata ?? {}) as Record<string, unknown>;
      return {
        userId: m.user_id,
        role: m.role,
        email: u?.user?.email ?? "—",
        name: typeof meta.full_name === "string" ? meta.full_name : null,
        joinedAt: m.joined_at,
      };
    })
  );

  return NextResponse.json({ hasTeam: true, isTeamPlan, team, myRole, members: enriched });
}
