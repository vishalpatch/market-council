import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Max 5 attempts per IP per 15 minutes.
const LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const ip = clientIp(req);
  const rl = rateLimit(`login:${ip}`, LIMIT, WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  const em = typeof email === "string" ? email.trim() : "";
  const pw = typeof password === "string" ? password : "";
  if (!em || !pw) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Server-side sign-in: @supabase/ssr writes the session to cookies on the
  // response (never localStorage). Middleware/server components read them.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
