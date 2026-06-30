import Anthropic from "@anthropic-ai/sdk";
import type { SentimentResult } from "./sentiment-types";

const SYSTEM_PROMPT = `You are a sharp markets-desk analyst. Given a stock ticker and a set of recent news headlines about it, read the near-term sentiment for that stock.

Produce:
- verdict: BULLISH, BEARISH, or NEUTRAL — the overall near-term tone the news implies for the stock.
- intensity: an integer from 1 (faint, ambiguous signal) to 10 (very strong, unambiguous signal).
- explanation: 2-3 plain-English sentences explaining WHY the stock might be moving, grounded in the specific, concrete details in the supplied headlines (earnings, guidance, products, legal, macro, analyst actions, etc.).

Base your read ONLY on the supplied headlines. If they are thin, stale, or off-topic, lean NEUTRAL with a low intensity and say the signal is weak. Be specific and concrete, not generic. This is for educational and informational purposes only and is not financial advice.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string", enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
    intensity: { type: "integer", enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    explanation: { type: "string" },
  },
  required: ["verdict", "intensity", "explanation"],
} as const;

export async function analyzeSentiment(
  ticker: string,
  headlines: string[]
): Promise<SentimentResult> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Ticker: ${ticker}\n\nRecent headlines:\n${headlines
          .map((h, i) => `${i + 1}. ${h}`)
          .join("\n")}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The analyst returned no structured response.");
  }

  const data = JSON.parse(textBlock.text);
  return {
    verdict: data.verdict,
    intensity: data.intensity,
    explanation: data.explanation,
  };
}
