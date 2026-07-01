import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Max 3 attempts per IP per hour.
const LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`signup:${ip}`, LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { email, password, fullName } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    fullName?: unknown;
  };
  const em = typeof email === "string" ? email.trim() : "";
  const pw = typeof password === "string" ? password : "";
  const name = typeof fullName === "string" ? fullName.trim().slice(0, 120) : "";
  if (!em || !pw) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (pw.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: em,
    password: pw,
    options: { data: { full_name: name } },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Give every new user a Free subscription record up front.
  if (data.user?.id) {
    try {
      await createAdminClient()
        .from("subscriptions")
        .upsert(
          {
            user_id: data.user.id,
            plan: "free",
            status: "active",
            ai_model: null,
            monthly_ai_limit: 0,
          },
          { onConflict: "user_id" }
        );
    } catch {
      /* non-critical */
    }
  }

  return NextResponse.json({ ok: true });
}
