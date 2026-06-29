import { NextResponse } from "next/server";
import { getQuote, getCompanyProfile, getCompanyNews } from "@/lib/finnhub";

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();

  try {
    const [quote, profile, news] = await Promise.all([
      getQuote(symbol),
      getCompanyProfile(symbol),
      getCompanyNews(symbol),
    ]);

    return NextResponse.json({ quote, profile, news: news.slice(0, 8) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
