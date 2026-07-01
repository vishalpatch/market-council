import { NextResponse } from "next/server";
import {
  getQuote,
  getCompanyProfile,
  getCompanyNews,
  type CompanyProfile,
} from "@/lib/finnhub";
import { getSessionUser } from "@/lib/auth";
import { sanitizeTicker } from "@/lib/sanitize";

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const symbol = sanitizeTicker(params.symbol);
  if (!symbol) {
    return NextResponse.json({ error: "Invalid ticker symbol." }, { status: 400 });
  }

  try {
    // The quote is the only hard requirement. ETFs (e.g. VOO) and some symbols
    // return an empty company profile from Finnhub, so profile and news are
    // best-effort.
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
