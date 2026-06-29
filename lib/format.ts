export function formatPrice(n: number, currency = "USD"): string {
  const sym = currency === "USD" ? "$" : `${currency} `;
  return `${sym}${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Finnhub returns market cap in millions. */
export function formatMarketCap(millions: number, currency = "USD"): string {
  const sym = currency === "USD" ? "$" : `${currency} `;
  if (millions >= 1_000_000) return `${sym}${(millions / 1_000_000).toFixed(2)}T`;
  if (millions >= 1_000) return `${sym}${(millions / 1_000).toFixed(2)}B`;
  return `${sym}${millions.toFixed(0)}M`;
}

export function formatVolume(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export function formatRelativeDate(unixSeconds: number): string {
  const diffMs = Date.now() - unixSeconds * 1000;
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
