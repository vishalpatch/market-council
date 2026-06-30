import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import StockSearch from "@/components/StockSearch";
import WatchlistSection from "@/components/watchlist/WatchlistSection";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user.user_metadata?.full_name ?? user.email ?? "Investor";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <DashboardNav email={user.email} active="dashboard" />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Welcome banner */}
        <div className="mb-12">
          <p className="text-emerald-400 text-sm font-medium mb-2">Dashboard</p>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Welcome back, {displayName.split(" ")[0]}
          </h1>
          <p className="text-zinc-400">
            Your AI investment committee is ready. Submit a thesis to begin.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          {[
            { label: "Analyses Run", value: "0", delta: "Get started below" },
            { label: "Active Positions", value: "0", delta: "None tracked yet" },
            { label: "Avg Conviction", value: "—", delta: "No data yet" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.delta}</p>
            </div>
          ))}
        </div>

        {/* Watchlist */}
        <div className="mb-12">
          <p className="text-emerald-400 text-sm font-medium mb-2">Watchlist</p>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Your Watchlist</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Track tickers you care about. Prices update each time you load the page.
          </p>
          <WatchlistSection userId={user.id} />
        </div>

        {/* Stock lookup */}
        <div className="mb-12">
          <p className="text-emerald-400 text-sm font-medium mb-2">Market Data</p>
          <h2 className="text-2xl font-bold tracking-tight mb-1">Stock Lookup</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Enter any ticker to see real-time price, financials, and latest news.
          </p>
          <StockSearch />
        </div>

        {/* CTAs */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 4V16M4 10H16"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Convene the AI Committee</h2>
            <p className="text-zinc-400 text-sm mb-6 max-w-xs mx-auto">
              Five specialized AI analysts debate your thesis and a Chairman delivers a verdict.
            </p>
            <Link
              href="/dashboard/committee"
              className="inline-block px-6 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 transition-colors text-sm"
            >
              New Analysis
            </Link>
          </div>

          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-10 text-center">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 6h12M4 10h8M4 14h10"
                  stroke="#71717a"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Trade Journal</h2>
            <p className="text-zinc-400 text-sm mb-6 max-w-xs mx-auto">
              Log investment ideas and track their status from watching to entry to exit.
            </p>
            <Link
              href="/dashboard/journal"
              className="inline-block px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-200 font-semibold hover:border-zinc-500 transition-colors text-sm"
            >
              Open Journal
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
