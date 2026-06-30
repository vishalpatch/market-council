import Anthropic from "@anthropic-ai/sdk";

export interface BriefingInput {
  symbol: string;
  companyName: string;
  date: string;
  epsEstimate?: number | null;
}

const SYSTEM_PROMPT = `You are an equity research analyst writing a concise, plain-English pre-earnings briefing for a retail investor. Given a company and its upcoming earnings date, write 2-3 short paragraphs covering: what the market will be watching for, the key metrics and guidance that tend to move this kind of stock, and the main risks or swing factors into the print. Be concrete and avoid hype. This is for educational and informational purposes only and is not financial advice.`;

export async function buildBriefing(input: BriefingInput): Promise<string> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Company: ${input.companyName} (${input.symbol})
Expected report date: ${input.date || "upcoming"}
Consensus EPS estimate: ${input.epsEstimate ?? "n/a"}

Write the pre-earnings briefing.`,
      },
    ],
  });

  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();

  if (!text) throw new Error("The analyst returned no briefing.");
  return text;
}
