import Anthropic from "@anthropic-ai/sdk";

export interface StressAnalysisInput {
  holdings: { ticker: string; alloc: number; sector: string }[];
  crises: { name: string; drawdownPct: number; dollarLoss: number }[];
}

const SYSTEM_PROMPT = `You are a portfolio risk analyst. Given a portfolio's sector mix and its estimated drawdowns across major historical market crises, write a concise plain-English risk assessment (2-3 short paragraphs): where the portfolio is most fragile, which crises would hurt most and why, the concentration risks, and one or two practical diversification suggestions. This is for educational and informational purposes only and is not financial advice.`;

export async function buildStressAnalysis(input: StressAnalysisInput): Promise<string> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const holdings = input.holdings
    .map((h) => `${h.ticker} (${h.sector}) ${h.alloc}%`)
    .join(", ");
  const crises = input.crises
    .map((c) => `${c.name}: −${c.drawdownPct.toFixed(0)}% (≈$${Math.round(c.dollarLoss)} on $10k)`)
    .join("; ");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 900,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Portfolio: ${holdings}\n\nEstimated stress-test drawdowns: ${crises}\n\nWrite the risk assessment.`,
      },
    ],
  });

  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (!text) throw new Error("The analyst returned no assessment.");
  return text;
}
