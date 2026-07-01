import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface AnalysisRow {
  thesis: string | null;
  result: { chairman?: { verdict?: string } } | null;
  created_at: string;
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const teamId = new URL(req.url).searchParams.get("teamId") ?? "";
  if (!teamId) return NextResponse.json({ error: "teamId required." }, { status: 400 });

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || (membership.role !== "owner" && membership.role !== "manager")) {
    return NextResponse.json({ error: "Managers only." }, { status: 403 });
  }

  const { data: members } = await admin
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", teamId);

  const activity = await Promise.all(
    (members ?? []).map(async (m) => {
      const [{ data: u }, analyses, watchCount, snapCount] = await Promise.all([
        admin.auth.admin.getUserById(m.user_id),
        admin
          .from("committee_analyses")
          .select("thesis, result, created_at")
          .eq("user_id", m.user_id)
          .order("created_at", { ascending: false })
          .limit(5),
        admin
          .from("watchlist_items")
          .select("*", { count: "exact", head: true })
          .eq("user_id", m.user_id),
        admin
          .from("track_record_snapshots")
          .select("*", { count: "exact", head: true })
          .eq("user_id", m.user_id),
      ]);
      const meta = (u?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const recent = ((analyses.data as AnalysisRow[]) ?? []).map((a) => ({
        thesis: (a.thesis ?? "").slice(0, 80),
        verdict: a.result?.chairman?.verdict ?? "NEUTRAL",
        date: a.created_at,
      }));
      return {
        userId: m.user_id,
        role: m.role,
        email: u?.user?.email ?? "—",
        name: typeof meta.full_name === "string" ? meta.full_name : null,
        recentAnalyses: recent,
        watchlistCount: watchCount.count ?? 0,
        trackedTheses: snapCount.count ?? 0,
      };
    })
  );

  return NextResponse.json({ activity });
}
