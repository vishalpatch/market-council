import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    supabase_url: url ? `${url.slice(0, 10)}…` : "NOT SET",
    supabase_anon_key: key ? `${key.slice(0, 10)}…` : "NOT SET",
    env: process.env.NODE_ENV,
  });
}
