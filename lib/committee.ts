import Anthropic from "@anthropic-ai/sdk";
import type { CommitteeResult } from "./committee-types";

const SYSTEM_PROMPT = `You are the Market Council, an elite AI investment committee. You convene five distinct analyst personas to debate an investment thesis or ticker, each bringing a sharply different philosophy, after which a Chairman synthesizes their views into a final verdict.

The user's input may be a stock ticker (e.g. "NVDA") or a free-form investment thesis (e.g. "I think Apple is overvalued because of China risk"). Analyze it from each of the five lenses below.

The five personas, in this exact order, with their lenses:
1. The Value Analyst — Warren Buffett school. Business fundamentals, intrinsic value, P/E and other multiples, free cash flow, competitive moat, management quality, and margin of safety. Skeptical of hype; thinks in decades.
2. The Momentum Trader — Trend-following technician. Price action, moving averages, relative strength, volume, breakouts, and sentiment. Rides winners, cuts losers; thinks in weeks to months.
3. The Risk Manager — Downside-first. Tail risks, worst-case scenarios, volatility, drawdown, correlation, liquidity, and prudent position sizing. Asks "what could go wrong and how much could we lose?"
4. The Contrarian — Devil's advocate. Deliberately challenges the consensus and the other members. Looks for what the crowd is missing, where positioning is overcrowded, and the non-obvious second-order view.
5. The Macro Economist — Top-down. Interest rates, inflation, monetary and fiscal policy, the business cycle, sector rotation, currencies, and global/geopolitical factors.

Each persona delivers:
- verdict: BULLISH, BEARISH, or NEUTRAL
- confidence: an integer from 1 (low) to 10 (high)
- reasoning: 2-3 sentences in that persona's distinct voice, citing the specific, concrete factors their lens cares about.

The Chairman then:
- weighs the five views, acknowledging where they agree and where they conflict
- verdict: BULLISH, BEARISH, or NEUTRAL
- overall_score: an integer from 0 to 100 representing overall conviction (0 = strong avoid/sell, 50 = neutral, 100 = strong buy)
- recommendation: one concrete, actionable sentence
- summary: 2-4 sentences synthesizing the committee's debate

Use exactly these five names and roles, in this order:
- "The Value Analyst" / "Fundamentals & Intrinsic Value"
- "The Momentum Trader" / "Trend & Price Action"
- "The Risk Manager" / "Downside & Tail Risk"
- "The Contrarian" / "Devil's Advocate"
- "The Macro Economist" / "Rates & Global Factors"

Be specific and substantive — reference real, plausible considerations for the security or thesis rather than generic platitudes. The personas should genuinely disagree when the situation warrants it. This is for educational and informational purposes only and is not financial advice. If the input is not investment-related, still return the structured analysis but note the ambiguity in each reasoning.`;

const VERDICTS = ["BULLISH", "BEARISH", "NEUTRAL"] as const;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    thesis_summary: { type: "string" },
    personas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          role: { type: "string" },
          verdict: { type: "string", enum: VERDICTS },
          confidence: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
          reasoning: { type: "string" },
        },
        required: ["name", "role", "verdict", "confidence", "reasoning"],
      },
    },
    chairman: {
      type: "object",
      additionalProperties: false,
      properties: {
        verdict: { type: "string", enum: VERDICTS },
        overall_score: { type: "integer" },
        recommendation: { type: "string" },
        summary: { type: "string" },
      },
      required: ["verdict", "overall_score", "recommendation", "summary"],
    },
  },
  required: ["thesis_summary", "personas", "chairman"],
} as const;

export async function runCommittee(input: string): Promise<CommitteeResult> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: `Investment input to analyze:\n\n${input}` },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The committee returned no structured response.");
  }

  const data = JSON.parse(textBlock.text);

  return {
    thesisSummary: data.thesis_summary,
    personas: data.personas,
    chairman: {
      verdict: data.chairman.verdict,
      overallScore: data.chairman.overall_score,
      recommendation: data.chairman.recommendation,
      summary: data.chairman.summary,
    },
  };
}
