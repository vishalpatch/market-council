// Client-safe types for the Sentiment War-Room. No server-only imports.
import type { Verdict } from "./committee-types";

export type { Verdict };

export interface SentimentResult {
  verdict: Verdict;
  intensity: number; // 1 (faint) - 10 (very strong)
  explanation: string;
}
