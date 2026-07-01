// Server-side input sanitization before values reach external APIs
// (Finnhub, Anthropic). Length-limits and strips unexpected characters.

export const MAX_TICKER = 12;

// Strip control characters while keeping tab, newline, and carriage return.
// Built from an escaped string so no literal control bytes live in source.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]",
  "g"
);

/** Ticker symbols: uppercase, [A-Z0-9.-] only, capped length. */
export function sanitizeTicker(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.\-]/g, "")
    .slice(0, MAX_TICKER);
}

/** Free text: strip control chars (keeping tab/newline/CR), trim, hard cap. */
export function sanitizeText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return raw.replace(CONTROL_CHARS, "").trim().slice(0, max);
}

/** Coerce to a finite number within bounds, or null. */
export function sanitizeNumber(raw: unknown, min: number, max: number): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
}
