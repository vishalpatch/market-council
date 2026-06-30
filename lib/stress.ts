// Pure, client-safe historical stress-test model. No server imports.
// Sector drawdown figures are realistic estimates of how each sector fared in
// each crisis — for educational illustration, not precise backtests.

export interface Holding {
  ticker: string;
  alloc: number; // percent
}

export type SectorKey =
  | "Technology"
  | "Financials"
  | "Energy"
  | "Healthcare"
  | "Consumer"
  | "Industrials"
  | "Communication"
  | "Utilities"
  | "RealEstate"
  | "Other";

export const SECTOR_LABEL: Record<SectorKey, string> = {
  Technology: "Technology",
  Financials: "Financials",
  Energy: "Energy",
  Healthcare: "Healthcare",
  Consumer: "Consumer",
  Industrials: "Industrials",
  Communication: "Communication",
  Utilities: "Utilities",
  RealEstate: "Real Estate",
  Other: "Other",
};

const INDUSTRY_TO_SECTOR: Record<string, SectorKey> = {
  Technology: "Technology",
  Semiconductors: "Technology",
  Software: "Technology",
  Hardware: "Technology",
  Banking: "Financials",
  "Financial Services": "Financials",
  Insurance: "Financials",
  Energy: "Energy",
  Pharmaceuticals: "Healthcare",
  Biotechnology: "Healthcare",
  "Health Care": "Healthcare",
  Healthcare: "Healthcare",
  "Consumer products": "Consumer",
  Retail: "Consumer",
  Automobiles: "Consumer",
  Industrials: "Industrials",
  Machinery: "Industrials",
  "Aerospace & Defense": "Industrials",
  Airlines: "Industrials",
  Media: "Communication",
  Telecommunication: "Communication",
  Utilities: "Utilities",
  "Real Estate": "RealEstate",
};

export function sectorForIndustry(industry: string | null | undefined): SectorKey {
  if (!industry) return "Other";
  if (INDUSTRY_TO_SECTOR[industry]) return INDUSTRY_TO_SECTOR[industry];
  const s = industry.toLowerCase();
  if (/(tech|semic|software|internet|hardware)/.test(s)) return "Technology";
  if (/(bank|financ|insur|capital|asset manage)/.test(s)) return "Financials";
  if (/(oil|gas|energy|petrol)/.test(s)) return "Energy";
  if (/(pharm|biotech|health|medical|life science)/.test(s)) return "Healthcare";
  if (/(retail|consumer|food|apparel|auto|beverage|restaurant)/.test(s)) return "Consumer";
  if (/(media|telecom|communic|entertain|publish)/.test(s)) return "Communication";
  if (/util/.test(s)) return "Utilities";
  if (/(real estate|reit)/.test(s)) return "RealEstate";
  if (/(indust|machin|aero|airline|transport|construct|logistic)/.test(s))
    return "Industrials";
  return "Other";
}

export interface Crisis {
  key: string;
  name: string;
  blurb: string;
  marketDrawdown: number; // % peak-to-trough
  recoveryMonths: number;
  sector: Record<SectorKey, number>; // loss % (negative = a gain)
}

export const CRISES: Crisis[] = [
  {
    key: "gfc2008",
    name: "2008 Financial Crisis",
    blurb: "Oct 2007 – Mar 2009 · S&P −56%",
    marketDrawdown: 56,
    recoveryMonths: 49,
    sector: {
      Financials: 78,
      RealEstate: 75,
      Industrials: 60,
      Energy: 55,
      Technology: 52,
      Communication: 50,
      Consumer: 45,
      Utilities: 40,
      Healthcare: 38,
      Other: 56,
    },
  },
  {
    key: "covid2020",
    name: "COVID Crash",
    blurb: "Feb – Mar 2020 (33 days) · S&P −34%",
    marketDrawdown: 34,
    recoveryMonths: 5,
    sector: {
      Energy: 55,
      Financials: 42,
      RealEstate: 42,
      Industrials: 40,
      Utilities: 38,
      Consumer: 36,
      Communication: 30,
      Technology: 28,
      Healthcare: 26,
      Other: 34,
    },
  },
  {
    key: "dotcom",
    name: "Dot-com Bust",
    blurb: "Mar 2000 – Oct 2002 · S&P −49%",
    marketDrawdown: 49,
    recoveryMonths: 56,
    sector: {
      Technology: 82,
      Communication: 72,
      Industrials: 32,
      Financials: 30,
      Consumer: 28,
      Healthcare: 25,
      Utilities: 20,
      Energy: 15,
      RealEstate: 10,
      Other: 49,
    },
  },
  {
    key: "rate2022",
    name: "2022 Rate-Hike Bear",
    blurb: "Jan – Oct 2022 · S&P −25%",
    marketDrawdown: 25,
    recoveryMonths: 24,
    sector: {
      Communication: 40,
      Consumer: 34,
      Technology: 33,
      RealEstate: 28,
      Financials: 18,
      Industrials: 16,
      Healthcare: 12,
      Utilities: 8,
      Other: 25,
      Energy: -45,
    },
  },
];

export interface HoldingResolved extends Holding {
  sector: SectorKey;
  price: number | null;
}

export interface CrisisResult {
  key: string;
  name: string;
  blurb: string;
  drawdownPct: number;
  dollarLoss: number;
  recoveryMonths: number;
  marketDrawdown: number;
}

export function computeCrises(
  holdings: HoldingResolved[],
  invest = 10000
): CrisisResult[] {
  const totalAlloc = holdings.reduce((s, h) => s + (h.alloc || 0), 0) || 1;
  return CRISES.map((c) => {
    let dd = 0;
    for (const h of holdings) {
      dd += ((h.alloc || 0) / totalAlloc) * c.sector[h.sector];
    }
    return {
      key: c.key,
      name: c.name,
      blurb: c.blurb,
      drawdownPct: dd,
      dollarLoss: dd > 0 ? invest * (dd / 100) : 0,
      recoveryMonths: c.recoveryMonths,
      marketDrawdown: c.marketDrawdown,
    };
  });
}

export function sectorBreakdown(
  holdings: HoldingResolved[]
): { sector: SectorKey; label: string; weight: number }[] {
  const total = holdings.reduce((s, h) => s + (h.alloc || 0), 0) || 1;
  const map = new Map<SectorKey, number>();
  for (const h of holdings) {
    map.set(h.sector, (map.get(h.sector) ?? 0) + (h.alloc || 0));
  }
  return Array.from(map.entries())
    .map(([sector, a]) => ({
      sector,
      label: SECTOR_LABEL[sector],
      weight: (a / total) * 100,
    }))
    .sort((x, y) => y.weight - x.weight);
}
