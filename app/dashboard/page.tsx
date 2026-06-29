import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name ?? user.email ?? "Investor";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Dashboard header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 12L6 7L9 10L13 4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">Market Council</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden sm:block">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-zinc-50 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
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

        {/* Submit thesis CTA */}
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 p-12 text-center">
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
          <h2 className="text-lg font-semibold mb-2">Submit your first thesis</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
            Describe an investment idea or enter a ticker. The council will research and debate it.
          </p>
          <button className="px-6 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 transition-colors text-sm">
            New Analysis
          </button>
        </div>
      </main>
    </div>
  );
}
