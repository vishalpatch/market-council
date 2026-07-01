// Client-safe ticker extraction from free-text theses.

const STOPWORDS = new Set([
  "I", "A", "AN", "THE", "IS", "IT", "IF", "OR", "AND", "BUT", "TO", "OF", "IN",
  "ON", "AT", "BE", "DO", "GO", "US", "WE", "MY", "SO", "AS", "BY", "UP", "VS",
  "CEO", "CFO", "IPO", "ETF", "AI", "EPS", "USD", "Q1", "Q2", "Q3", "Q4", "YOY",
  "ATH", "PE", "EV", "FED", "GDP", "CPI",
]);

export function extractTickers(text: string): string[] {
  const matches = text.match(/\b[A-Z]{1,5}\b/g) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    if (STOPWORDS.has(m) || seen.has(m)) continue;
    seen.add(m);
    out.push(m);
  }
  return out;
}

export function firstTicker(text: string): string | null {
  return extractTickers(text)[0] ?? null;
}
