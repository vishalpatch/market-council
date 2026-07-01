import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/finnhub";
import { sectorForIndustry, SECTOR_LABEL, type SectorKey } from "@/lib/stress";
import { extractTickers } from "@/lib/tickers";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TICKERS = 24;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const [analysesR, journalR, watchlistR, portfoliosR] = await Promise.all([
      supabase.from("committee_analyses").select("thesis, result, user_agreement"),
      supabase.from("journal_entries").select("ticker, status, outcome"),
      supabase.from("watchlist_items").select("ticker"),
      supabase.from("stress_test_portfolios").select("holdings"),
    ]);

    const analyses = analysesR.data ?? [];
    const journal = journalR.data ?? [];
    const watchlist = watchlistR.data ?? [];
    const portfolios = portfoliosR.data ?? [];

    const dataPoints =
      analyses.length + journal.length + watchlist.length + portfolios.length;
    if (dataPoints < 3) {
      return NextResponse.json({ enough: false });
    }

    // ── Committee signals ──
    let bull = 0;
    let bear = 0;
    let scoreSum = 0;
    let agree = 0;
    let disagree = 0;
    for (const a of analyses) {
      const v = (a.result as { chairman?: { verdict?: string; overallScore?: number } })
        ?.chairman;
      if (v?.verdict === "BULLISH") bull++;
      else if (v?.verdict === "BEARISH") bear++;
      scoreSum += v?.overallScore ?? 0;
      if (a.user_agreement === true) agree++;
      else if (a.user_agreement === false) disagree++;
    }
    const avgConviction = analyses.length ? Math.round(scoreSum / analyses.length) : 0;
    const directional = bull + bear;
    const bullBias = directional ? bull / directional : 0.5;
    const decided = agree + disagree;
    const disagreementRate = decided ? disagree / decided : 0;

    // ── Journal signals ──
    let entered = 0;
    let exited = 0;
    let wins = 0;
    let losses = 0;
    const journalTickers = new Set<string>();
    for (const e of journal) {
      if (e.status === "Entered") entered++;
      else if (e.status === "Exited") exited++;
      if (e.outcome === "win") wins++;
      else if (e.outcome === "loss") losses++;
      if (e.ticker) journalTickers.add((e.ticker as string).toUpperCase());
    }
    const actedRatio = journal.length ? (entered + exited) / journal.length : 0;
    const decidedTrades = wins + losses;
    const winRate = decidedTrades ? Math.round((wins / decidedTrades) * 100) : null;
    const turnover = clamp01(journalTickers.size / 8);

    // ── Portfolio concentration (Herfindahl of allocations) ──
    const concentrations: number[] = [];
    const holdingCounts: number[] = [];
    for (const p of portfolios) {
      const holdings = (p.holdings as { alloc: number }[]) ?? [];
      const total = holdings.reduce((s, h) => s + (h.alloc || 0), 0) || 1;
      const hhi = holdings.reduce((s, h) => s + Math.pow((h.alloc || 0) / total, 2), 0);
      concentrations.push(hhi);
      holdingCounts.push(holdings.length);
    }
    const avgConcentration = concentrations.length ? mean(concentrations) : 0;
    const avgHoldings = holdingCounts.length ? mean(holdingCounts) : 0;

    // ── Sectors (bounded Finnhub lookups) ──
    const tickerSet = new Set<string>();
    watchlist.forEach((w) => tickerSet.add((w.ticker as string).toUpperCase()));
    journalTickers.forEach((t) => tickerSet.add(t));
    for (const a of analyses) extractTickers(a.thesis ?? "").forEach((t) => tickerSet.add(t));
    const tickers = Array.from(tickerSet).slice(0, MAX_TICKERS);

    const sectorCounts = new Map<SectorKey, number>();
    await Promise.all(
      tickers.map(async (t) => {
        try {
          const profile = await getCompanyProfile(t);
          const sec = sectorForIndustry(profile.industry);
          sectorCounts.set(sec, (sectorCounts.get(sec) ?? 0) + 1);
        } catch {
          /* skip ETFs / unknown */
        }
      })
    );
    const sectorTotal = Array.from(sectorCounts.values()).reduce((a, b) => a + b, 0);
    const topSectorEntry = Array.from(sectorCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    const topSector = topSectorEntry ? SECTOR_LABEL[topSectorEntry[0]] : null;
    const topSectorShare = topSectorEntry && sectorTotal ? topSectorEntry[1] / sectorTotal : 0;
    const sectorDiversity = clamp01(sectorCounts.size / 6);

    // ── Derive style ──
    const styles = [
      { label: "Momentum", score: 0.4 * actedRatio + 0.3 * turnover + 0.3 * bullBias,
        blurb: "You move with the trend — acting on ideas and favoring names already in motion." },
      { label: "Value", score: 0.4 * (avgConviction / 100) + 0.3 * avgConcentration + 0.3 * (1 - turnover),
        blurb: "You concentrate on high-conviction names and commit rather than chase." },
      { label: "Contrarian", score: 0.6 * disagreementRate + 0.4 * (1 - bullBias),
        blurb: "You push back on consensus and aren't afraid to take the other side." },
      { label: "Macro", score: 0.6 * sectorDiversity + 0.4 * clamp01(watchlist.length / 10),
        blurb: "You think broadly across sectors rather than betting on single names." },
    ].sort((a, b) => b.score - a.score);
    const style = styles[0];

    // ── Risk appetite ──
    const riskSignals: number[] = [topSectorShare, 1 - clamp01(watchlist.length / 12)];
    if (concentrations.length) riskSignals.push(avgConcentration);
    if (avgHoldings) riskSignals.push(1 - clamp01(avgHoldings / 8));
    const riskScore = mean(riskSignals);
    const risk =
      riskScore >= 0.6
        ? { label: "Aggressive", blurb: "Concentrated bets and high conviction — you accept volatility for upside." }
        : riskScore >= 0.38
          ? { label: "Moderate", blurb: "A balanced mix of conviction and diversification." }
          : { label: "Conservative", blurb: "Spread-out exposure and measured position sizes." };

    // ── Decision speed (inferred from how many logged ideas get acted on) ──
    const decisionSpeed =
      journal.length === 0
        ? { label: "Unproven", blurb: "Not enough journal activity to read your tempo yet." }
        : actedRatio >= 0.66
          ? { label: "Decisive", blurb: "You act on most ideas you log rather than letting them sit." }
          : actedRatio >= 0.33
            ? { label: "Measured", blurb: "You commit to some ideas and let others marinate." }
            : { label: "Deliberate", blurb: "Most ideas stay on watch before you ever pull the trigger." };

    // ── Insights (pick the 3 most salient) ──
    const candidates: { text: string; weight: number }[] = [];
    if (decided >= 2)
      candidates.push({
        text: `You push back on the committee ${Math.round(disagreementRate * 100)}% of the time${disagreementRate >= 0.4 ? " — a genuine contrarian streak." : "."}`,
        weight: Math.abs(disagreementRate - 0.5) + 0.3,
      });
    if (topSector && topSectorShare >= 0.4)
      candidates.push({
        text: `${Math.round(topSectorShare * 100)}% of the names you follow sit in ${topSector} — concentrated sector exposure.`,
        weight: topSectorShare,
      });
    if (analyses.length >= 2)
      candidates.push({
        text:
          avgConviction >= 70
            ? `Your saved theses average ${avgConviction}/100 conviction — you commit when you commit.`
            : `Your theses average a measured ${avgConviction}/100 conviction — you tend to hedge your calls.`,
        weight: Math.abs(avgConviction - 55) / 100 + 0.2,
      });
    if (decidedTrades >= 2 && winRate !== null)
      candidates.push({
        text: `Your closed trades are running ${winRate}% winners across ${decidedTrades} tagged outcomes.`,
        weight: Math.abs(winRate - 50) / 100 + 0.25,
      });
    if (journal.length >= 3)
      candidates.push({
        text:
          actedRatio >= 0.66
            ? "You act on most ideas you log — rarely leaving them in 'Watching'."
            : "Many of your ideas stay in 'Watching' — you deliberate before committing capital.",
        weight: Math.abs(actedRatio - 0.5) + 0.2,
      });
    if (directional >= 2)
      candidates.push({
        text: `${Math.round(bullBias * 100)}% of your directional theses are bull cases.`,
        weight: Math.abs(bullBias - 0.5) + 0.15,
      });
    const insights = candidates.sort((a, b) => b.weight - a.weight).slice(0, 3).map((c) => c.text);
    while (insights.length < 3 && insights.length < candidates.length) {
      insights.push(candidates[insights.length].text);
    }

    return NextResponse.json({
      enough: true,
      style: { label: style.label, blurb: style.blurb },
      risk,
      sector: topSector ? { label: topSector, share: Math.round(topSectorShare * 100) } : null,
      decisionSpeed,
      insights,
      stats: {
        analyses: analyses.length,
        trades: journal.length,
        tracked: watchlist.length,
        avgConviction,
        bullPct: directional ? Math.round(bullBias * 100) : null,
      },
    });
  } catch (err) {
    console.error("[investment-profile] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
