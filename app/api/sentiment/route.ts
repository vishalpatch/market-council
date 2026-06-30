import { NextResponse } from "next/server";
import { getCompanyNews, getCompanyProfile } from "@/lib/finnhub";
import { analyzeSentiment } from "@/lib/sentiment";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raw = body?.ticker;

    if (!raw || typeof raw !== "string" || !raw.trim()) {
      return NextResponse.json(
        { error: "Please enter a ticker symbol." },
        { status: 400 }
      );
    }

    const ticker = raw.trim().toUpperCase();

    const [news, profile] = await Promise.all([
      getCompanyNews(ticker),
      getCompanyProfile(ticker).catch(() => null),
    ]);

    if (!news.length) {
      return NextResponse.json(
        { error: `No recent news found for ${ticker}.` },
        { status: 404 }
      );
    }

    const headlines = news.slice(0, 12).map((n) => n.headline);
    const sentiment = await analyzeSentiment(ticker, headlines);

    return NextResponse.json({
      ticker,
      companyName: profile?.name ?? ticker,
      sentiment,
      news: news.slice(0, 8),
    });
  } catch (err) {
    console.error("[sentiment] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Sentiment analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
