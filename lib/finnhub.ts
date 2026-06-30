const BASE = "https://finnhub.io/api/v1";

function key() {
  const k = process.env.FINNHUB_API_KEY;
  if (!k) throw new Error("FINNHUB_API_KEY is not set");
  return k;
}

export interface Quote {
  price: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  prevClose: number;
}

export interface CompanyProfile {
  name: string;
  ticker: string;
  logo: string;
  industry: string;
  marketCap: number;
  exchange: string;
  currency: string;
  weburl: string;
}

export interface NewsItem {
  headline: string;
  summary: string;
  url: string;
  datetime: number;
  source: string;
  image: string;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const res = await fetch(
    `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${key()}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`Quote fetch failed (${res.status})`);
  const d = await res.json();
  if (d.c === 0 && d.pc === 0) throw new Error(`Symbol not found: ${symbol}`);
  return {
    price: d.c,
    change: d.d,
    percentChange: d.dp,
    high: d.h,
    low: d.l,
    prevClose: d.pc,
  };
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile> {
  const res = await fetch(
    `${BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key()}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);
  const d = await res.json();
  if (!d.name) throw new Error(`Symbol not found: ${symbol}`);
  return {
    name: d.name,
    ticker: d.ticker,
    logo: d.logo,
    industry: d.finnhubIndustry,
    marketCap: d.marketCapitalization,
    exchange: d.exchange,
    currency: d.currency,
    weburl: d.weburl,
  };
}

export async function getCompanyNews(symbol: string): Promise<NewsItem[]> {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const res = await fetch(
    `${BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${key()}`,
    { next: { revalidate: 1800 } }
  );
  if (!res.ok) throw new Error(`News fetch failed (${res.status})`);
  return res.json();
}

export interface EarningsEvent {
  symbol: string;
  date: string; // YYYY-MM-DD
  hour: string; // "bmo" | "amc" | "dmh" | ""
  quarter: number;
  year: number;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
}

export async function getEarningsCalendar(
  symbol: string,
  from: string,
  to: string
): Promise<EarningsEvent[]> {
  const res = await fetch(
    `${BASE}/calendar/earnings?from=${from}&to=${to}&symbol=${encodeURIComponent(
      symbol
    )}&token=${key()}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Earnings calendar fetch failed (${res.status})`);
  const d = await res.json();
  return (d.earningsCalendar ?? []) as EarningsEvent[];
}

/** Market-wide earnings for a date range (no symbol filter). */
export async function getEarningsCalendarRange(
  from: string,
  to: string
): Promise<EarningsEvent[]> {
  const res = await fetch(
    `${BASE}/calendar/earnings?from=${from}&to=${to}&token=${key()}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Earnings calendar fetch failed (${res.status})`);
  const d = await res.json();
  return (d.earningsCalendar ?? []) as EarningsEvent[];
}

export interface IpoEvent {
  symbol: string;
  name: string;
  date: string;
  exchange: string;
  price: string;
  numberOfShares: number;
  totalSharesValue: number;
  status: string;
}

/** Upcoming IPOs for a date range (free tier). */
export async function getIpoCalendar(from: string, to: string): Promise<IpoEvent[]> {
  const res = await fetch(
    `${BASE}/calendar/ipo?from=${from}&to=${to}&token=${key()}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`IPO calendar fetch failed (${res.status})`);
  const d = await res.json();
  return (d.ipoCalendar ?? []) as IpoEvent[];
}

export interface SymbolMatch {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

/** Symbol/company search for autocomplete (free tier). */
export async function searchSymbols(q: string): Promise<SymbolMatch[]> {
  const res = await fetch(
    `${BASE}/search?q=${encodeURIComponent(q)}&token=${key()}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Symbol search failed (${res.status})`);
  const d = await res.json();
  return (d.result ?? []) as SymbolMatch[];
}

export interface MarketNewsItem {
  id: number;
  headline: string;
  summary: string;
  url: string;
  datetime: number;
  source: string;
  image: string;
  category: string;
}

/** General market news feed (free tier). */
export async function getMarketNews(category = "general"): Promise<MarketNewsItem[]> {
  const res = await fetch(
    `${BASE}/news?category=${encodeURIComponent(category)}&token=${key()}`,
    { next: { revalidate: 900 } }
  );
  if (!res.ok) throw new Error(`Market news fetch failed (${res.status})`);
  return (await res.json()) as MarketNewsItem[];
}

export interface BasicFinancials {
  high52: number | null;
  low52: number | null;
}

/** 52-week high/low from basic financials (free tier). */
export async function getBasicFinancials(symbol: string): Promise<BasicFinancials> {
  const res = await fetch(
    `${BASE}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${key()}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Metrics fetch failed (${res.status})`);
  const d = await res.json();
  const m = d.metric ?? {};
  return {
    high52: m["52WeekHigh"] ?? null,
    low52: m["52WeekLow"] ?? null,
  };
}
