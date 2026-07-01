import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQuote } from "@/lib/finnhub";
import { sendTrackRecordEmail } from "@/lib/email/trackRecordEmail";

export const runtime = "nodejs";
export const maxDuration = 60;

const MILESTONES = [30, 60, 90];

interface SnapRow {
  id: string;
  user_id: string;
  ticker: string;
  price_at_submission: number;
  submitted_at: string;
  notified_days: number[] | null;
  committee_analyses: {
    thesis: string | null;
    result: { chairman?: { verdict?: string } } | null;
  } | null;
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // deny if not configured
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

async function run(testSnapshotId?: string) {
  const admin = createAdminClient();

  let query = admin
    .from("track_record_snapshots")
    .select(
      "id, user_id, ticker, price_at_submission, submitted_at, notified_days, committee_analyses(thesis, result)"
    );
  if (testSnapshotId) query = query.eq("id", testSnapshotId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const snaps = (data as unknown as SnapRow[]) ?? [];

  const results: {
    id: string;
    milestone: number;
    to?: string;
    sent: boolean;
    error?: string;
  }[] = [];

  for (const s of snaps) {
    const daysSince = Math.floor(
      (Date.now() - new Date(s.submitted_at).getTime()) / 86400000
    );

    // In test mode, force the most recent elapsed milestone (or 30). In cron
    // mode, only milestones that have elapsed and not yet been emailed.
    const due = testSnapshotId
      ? [MILESTONES.filter((m) => daysSince >= m).pop() ?? 30]
      : MILESTONES.filter((m) => daysSince >= m && !(s.notified_days ?? []).includes(m));
    if (due.length === 0) continue;

    const { data: userData } = await admin.auth.admin.getUserById(s.user_id);
    const email = userData?.user?.email;
    if (!email) continue;

    let currentPrice = 0;
    try {
      currentPrice = (await getQuote(s.ticker)).price;
    } catch {
      /* leave 0 */
    }

    const verdict = s.committee_analyses?.result?.chairman?.verdict ?? "NEUTRAL";
    const thesis = s.committee_analyses?.thesis ?? "";

    for (const m of due) {
      try {
        await sendTrackRecordEmail(email, {
          ticker: s.ticker,
          thesis,
          verdict,
          priceAtSubmission: s.price_at_submission,
          currentPrice,
          milestone: m,
        });
        if (!testSnapshotId) {
          const merged = Array.from(new Set([...(s.notified_days ?? []), m]));
          await admin
            .from("track_record_snapshots")
            .update({ notified_days: merged })
            .eq("id", s.id);
        }
        results.push({ id: s.id, milestone: m, to: email, sent: true });
      } catch (e) {
        results.push({
          id: s.id,
          milestone: m,
          to: email,
          sent: false,
          error: e instanceof Error ? e.message : "send failed",
        });
      }
    }
  }

  return results;
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const url = new URL(req.url);
    let testId = url.searchParams.get("snapshotId") ?? undefined;
    if (!testId && req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.snapshotId === "string") testId = body.snapshotId;
      } catch {
        /* no body */
      }
    }
    const results = await run(testId);
    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error("[send-track-record-email] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
