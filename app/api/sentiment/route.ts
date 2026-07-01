import { NextResponse } from "next/server";
import { getCompanyNews, getCompanyProfile } from "@/lib/finnhub";
import { analyzeSentiment } from "@/lib/sentiment";
import { getSessionUser } from "@/lib/auth";
import { sanitizeTicker } from "@/lib/sanitize";
import { checkAIUsage, recordAIUsage } from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json();
    const ticker = sanitizeTicker(body?.ticker);

    if (!ticker) {
      return NextResponse.json({ error: "Please enter a ticker symbol." }, { status: 400 });
    }

    const usage = await checkAIUsage(user.id, "market_pulse");
    if (!usage.allowed) {
      return NextResponse.json(
        {
          error:
            usage.reason === "free"
              ? "Market Pulse is a paid feature. Upgrade to read the tape."
              : `You've used all ${usage.limit} Market Pulse checks this month. Upgrade for more or wait until your next billing date.`,
          upgrade: true,
          usage,
        },
        { status: 402 }
      );
    }

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
    await recordAIUsage(user.id, "market_pulse");

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
