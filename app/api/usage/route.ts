import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { usageSnapshot } from "@/lib/usage";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const snapshot = await usageSnapshot();
  return NextResponse.json(snapshot);
}
