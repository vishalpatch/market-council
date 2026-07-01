import { NextResponse } from "next/server";
import { buildRebuttal, judgeDebate, type DebateTurn } from "@/lib/devils-advocate";
import { getSessionUser } from "@/lib/auth";
import { sanitizeTicker, sanitizeText } from "@/lib/sanitize";
import { checkAIUsage, recordAIUsage } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TURNS = 12;
const MAX_TURN_CHARS = 4000;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    const ticker = sanitizeTicker(body?.ticker);
    const mode = body?.mode === "referee" ? "referee" : "debate";
    const rawThread = Array.isArray(body?.thread) ? body.thread : [];

    // Sanitize and bound the transcript before it reaches Anthropic.
    const thread: DebateTurn[] = rawThread
      .slice(0, MAX_TURNS)
      .map((t: unknown) => {
        const turn = t as { role?: unknown; text?: unknown };
        return {
          role: turn?.role === "bear" ? "bear" : "bull",
          text: sanitizeText(turn?.text, MAX_TURN_CHARS),
        } as DebateTurn;
      })
      .filter((t: DebateTurn) => t.text.length > 0);

    if (thread.length === 0) {
      return NextResponse.json({ error: "A thesis is required to begin." }, { status: 400 });
    }

    if (mode === "referee") {
      const verdict = await judgeDebate(ticker, thread);
      return NextResponse.json({ verdict });
    }

    // One "debate" counts against the monthly limit at its start (opening thesis
    // only). Continuation rebuttals and the referee don't count again.
    const isStart = thread.length === 1;
    if (isStart) {
      const usage = await checkAIUsage(user.id, "devils_advocate");
      if (!usage.allowed) {
        return NextResponse.json(
          {
            error:
              usage.reason === "free"
                ? "Devil's Advocate is a paid feature. Upgrade to start debating."
                : `You've used all ${usage.limit} Devil's Advocate debates this month. Upgrade for more or wait until your next billing date.`,
            upgrade: true,
            usage,
          },
          { status: 402 }
        );
      }
    }

    const text = await buildRebuttal(ticker, thread);
    if (isStart) await recordAIUsage(user.id, "devils_advocate");
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[devils-advocate] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `The Devil's Advocate is unavailable: ${message}` },
      { status: 500 }
    );
  }
}
