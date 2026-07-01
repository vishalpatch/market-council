import Anthropic from "@anthropic-ai/sdk";

export interface DebateTurn {
  role: "bull" | "bear";
  text: string;
}

export interface RefereeVerdict {
  winner: "bull" | "bear" | "draw";
  bullScore: number; // 0-100
  bearScore: number; // 0-100
  reasoning: string;
}

const REBUTTAL_SYSTEM = `You are the Devil's Advocate: a sharp, well-informed bear arguing AGAINST the user's bullish thesis on a stock. Rebut the user's SPECIFIC points directly — engage their exact claims with concrete counter-arguments (competitive threats, valuation, margins, cyclicality, accounting, second-order effects), not generic risks. Be rigorous and intellectually honest, not a strawman.

CRITICAL: Keep every reply to a MAXIMUM of 3-4 sentences. Be punchy, direct, and dense — no filler, no throat-clearing, no restating their point at length. One tight paragraph only. This is educational, not financial advice.`;

function renderThread(ticker: string, thread: DebateTurn[]): string {
  const lines = thread.map(
    (t) => `${t.role === "bull" ? "BULL (user)" : "BEAR (you)"}: ${t.text}`
  );
  return `Stock under debate: ${ticker || "(unspecified)"}\n\nDebate so far:\n${lines.join(
    "\n\n"
  )}\n\nWrite the BEAR's next reply, directly rebutting the BULL's most recent points.`;
}

export async function buildRebuttal(ticker: string, thread: DebateTurn[]): Promise<string> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 350,
    system: REBUTTAL_SYSTEM,
    messages: [{ role: "user", content: renderThread(ticker, thread) }],
  });
  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  if (!text) throw new Error("The Devil's Advocate had nothing to say.");
  return text;
}

const REFEREE_SYSTEM = `You are a neutral debate referee judging a bull-vs-bear argument about a stock. Weigh the quality of reasoning, evidence, and how well each side answered the other — not which outcome you personally favor. Score each side 0-100 and name the winner. Keep the reasoning tight and decisive: a maximum of 3-4 sentences on what decided it, no more. This is educational, not financial advice.`;

const REFEREE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    winner: { type: "string", enum: ["bull", "bear", "draw"] },
    bull_score: { type: "integer" },
    bear_score: { type: "integer" },
    reasoning: { type: "string" },
  },
  required: ["winner", "bull_score", "bear_score", "reasoning"],
} as const;

export async function judgeDebate(
  ticker: string,
  thread: DebateTurn[]
): Promise<RefereeVerdict> {
  const client = new Anthropic();
  const transcript = thread
    .map((t) => `${t.role === "bull" ? "BULL" : "BEAR"}: ${t.text}`)
    .join("\n\n");
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: REFEREE_SCHEMA },
    },
    system: REFEREE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Stock: ${ticker || "(unspecified)"}\n\nTranscript:\n${transcript}\n\nJudge the debate.`,
      },
    ],
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("The referee returned no verdict.");
  }
  const d = JSON.parse(block.text);
  return {
    winner: d.winner,
    bullScore: d.bull_score,
    bearScore: d.bear_score,
    reasoning: d.reasoning,
  };
}
