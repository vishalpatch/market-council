// Deterministic mock OHLC generator. Finnhub's free tier doesn't provide
// historical candles, so we synthesize a realistic-looking series seeded by
// the ticker symbol + range. The series is anchored so its final close equals
// the real-time price, keeping the chart consistent with the live quote.

export type ChartType = "line" | "candlestick" | "area";
export type TimeRange = "1D" | "1W" | "1M" | "3M" | "1Y";

export const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: "line", label: "Line" },
  { key: "candlestick", label: "Candlestick" },
  { key: "area", label: "Area" },
];

export const TIME_RANGES: TimeRange[] = ["1D", "1W", "1M", "3M", "1Y"];

export interface Candle {
  /** Short axis label */
  label: string;
  /** Full label for tooltips */
  fullLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface RangeConfig {
  points: number;
  stepVol: number;
  wickVol: number;
  stepMs: number;
  label: (d: Date, range: TimeRange) => string;
  fullLabel: (d: Date) => string;
}

const RANGE_CONFIG: Record<TimeRange, RangeConfig> = {
  "1D": {
    points: 48,
    stepVol: 0.0018,
    wickVol: 0.0012,
    stepMs: 8 * 60 * 1000,
    label: (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    fullLabel: (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  },
  "1W": {
    points: 42,
    stepVol: 0.004,
    wickVol: 0.003,
    stepMs: 4 * 60 * 60 * 1000,
    label: (d) => d.toLocaleDateString("en-US", { weekday: "short" }),
    fullLabel: (d) => d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" }),
  },
  "1M": {
    points: 30,
    stepVol: 0.009,
    wickVol: 0.006,
    stepMs: 24 * 60 * 60 * 1000,
    label: (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    fullLabel: (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  },
  "3M": {
    points: 66,
    stepVol: 0.011,
    wickVol: 0.007,
    stepMs: 24 * 60 * 60 * 1000 * 1.4,
    label: (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    fullLabel: (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  },
  "1Y": {
    points: 52,
    stepVol: 0.02,
    wickVol: 0.012,
    stepMs: 7 * 24 * 60 * 60 * 1000,
    label: (d) => d.toLocaleDateString("en-US", { month: "short" }),
    fullLabel: (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
  },
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeries(
  symbol: string,
  range: TimeRange,
  currentPrice: number
): Candle[] {
  const cfg = RANGE_CONFIG[range];
  const rng = mulberry32(hashString(`${symbol}-${range}`));
  const now = Date.now();

  const candles: Candle[] = [];
  // Start somewhere near the current price; we'll re-anchor at the end.
  let prevClose = currentPrice * (0.85 + rng() * 0.3);

  for (let i = 0; i < cfg.points; i++) {
    const open = prevClose;
    // Mild upward drift plus symmetric noise.
    const drift = (rng() - 0.48) * 2 * cfg.stepVol;
    const close = open * (1 + drift);
    const bodyHi = Math.max(open, close);
    const bodyLo = Math.min(open, close);
    const high = bodyHi * (1 + rng() * cfg.wickVol);
    const low = bodyLo * (1 - rng() * cfg.wickVol);
    const volume = Math.round((0.6 + rng() * 0.8) * 1_000_000);

    const d = new Date(now - (cfg.points - 1 - i) * cfg.stepMs);
    candles.push({
      label: cfg.label(d, range),
      fullLabel: cfg.fullLabel(d),
      open,
      high,
      low,
      close,
      volume,
    });
    prevClose = close;
  }

  // Re-anchor the series so the last close matches the live price exactly.
  const ratio = currentPrice / candles[candles.length - 1].close;
  return candles.map((c) => ({
    ...c,
    open: c.open * ratio,
    high: c.high * ratio,
    low: c.low * ratio,
    close: c.close * ratio,
  }));
}

export interface MockStats {
  high52: number;
  low52: number;
  volume: number;
}

/** Stable 52-week high/low + a representative daily volume, derived from a
 *  full 1Y synthetic series so the metrics don't shift with the chart range. */
export function getMockStats(symbol: string, currentPrice: number): MockStats {
  const year = generateSeries(symbol, "1Y", currentPrice);
  return {
    high52: Math.max(...year.map((c) => c.high)),
    low52: Math.min(...year.map((c) => c.low)),
    volume: year[year.length - 1].volume * (40 + (hashString(symbol) % 60)),
  };
}
