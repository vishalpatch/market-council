import { NextResponse } from "next/server";
import {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
  type CompanyProfile,
} from "@/lib/finnhub";

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();

  try {
    // The quote is the only hard requirement. ETFs (e.g. VOO) and some symbols
    // return an empty company profile from Finnhub, which used to 404 the whole
    // request — so profile and news are now best-effort.
    const quote = await getQuote(symbol);

    const [profile, news] = await Promise.all([
      getCompanyProfile(symbol).catch(() => null),
      getCompanyNews(symbol).catch(() => []),
    ]);

    const safeProfile: CompanyProfile = profile ?? {
      name: symbol,
      ticker: symbol,
      logo: "",
      industry: "",
      marketCap: 0,
      exchange: "",
      currency: "USD",
      weburl: "",
    };

    return NextResponse.json({ quote, profile: safeProfile, news: news.slice(0, 8) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
