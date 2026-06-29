import { NextResponse } from "next/server";
import { runCommittee } from "@/lib/committee";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body?.input;

    if (!input || typeof input !== "string" || !input.trim()) {
      return NextResponse.json(
        { error: "Please provide a ticker symbol or an investment thesis." },
        { status: 400 }
      );
    }

    const result = await runCommittee(input.trim());
    return NextResponse.json(result);
  } catch (err) {
    console.error("[committee] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `The committee could not convene: ${message}` },
      { status: 500 }
    );
  }
}
