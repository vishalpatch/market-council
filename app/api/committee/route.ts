import { NextResponse } from "next/server";
import { runCommittee } from "@/lib/committee";
import { getSessionUser } from "@/lib/auth";
import { sanitizeText } from "@/lib/sanitize";
import { checkAIUsage, recordAIUsage } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    const input = sanitizeText(body?.input, 4000);

    if (!input) {
      return NextResponse.json(
        { error: "Please provide a ticker symbol or an investment thesis." },
        { status: 400 }
      );
    }

    const usage = await checkAIUsage(user.id, "committee");
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error:
            usage.reason === "free"
              ? "The AI Committee is a paid feature. Upgrade to start convening."
              : `You've used all ${usage.limit} Committee analyses this month. Upgrade for more or wait until your next billing date.`,
          upgrade: true,
          usage,
        },
        { status: 402 }
      );
    }

    const result = await runCommittee(input);
    await recordAIUsage(user.id, "committee");
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
