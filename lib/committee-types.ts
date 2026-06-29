// Client-safe types and metadata for the AI Investment Committee.
// No server-only imports here so this can be used in client components.

export type Verdict = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface PersonaVerdict {
  name: string;
  role: string;
  verdict: Verdict;
  confidence: number; // 1-10
  reasoning: string;
}

export interface ChairmanVerdict {
  verdict: Verdict;
  overallScore: number; // 0-100
  recommendation: string;
  summary: string;
}

export interface CommitteeResult {
  thesisSummary: string;
  personas: PersonaVerdict[];
  chairman: ChairmanVerdict;
}

/** Display metadata for each committee member (icon keyed by name). */
export const PERSONAS = [
  { name: "The Value Analyst", role: "Fundamentals & Intrinsic Value", icon: "🏛️" },
  { name: "The Momentum Trader", role: "Trend & Price Action", icon: "📈" },
  { name: "The Risk Manager", role: "Downside & Tail Risk", icon: "🛡️" },
  { name: "The Contrarian", role: "Devil's Advocate", icon: "⚔️" },
  { name: "The Macro Economist", role: "Rates & Global Factors", icon: "🌍" },
] as const;

export function personaIcon(name: string): string {
  return PERSONAS.find((p) => p.name === name)?.icon ?? "🧠";
}
