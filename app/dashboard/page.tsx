import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import WatchlistSection from "@/components/watchlist/WatchlistSection";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName = user.user_metadata?.full_name ?? user.email ?? "Investor";

  return (
    <AppShell active="dashboard" userEmail={user.email}>
      <main className="mx-auto max-w-5xl px-8 py-16 lg:px-12">
        {/* Masthead */}
        <header className="mb-20 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Dashboard</p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Good to see you, {displayName.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Your council stands ready. Track the names you care about, or bring a
            thesis to the committee.
          </p>
        </header>

        {/* Stat row */}
        <div className="mb-20 grid grid-cols-1 gap-px sm:grid-cols-3">
          {[
            { label: "Analyses Run", value: "0", sub: "Get started below" },
            { label: "Tracked Names", value: "—", sub: "Build your watchlist" },
            { label: "Avg Conviction", value: "—", sub: "No data yet" },
          ].map((stat) => (
            <div key={stat.label} className="border-t border-hairline pt-6 sm:pr-8">
              <p className="text-xs uppercase tracking-[0.15em] text-faint">
                {stat.label}
              </p>
              <p className="mt-2 font-serif text-4xl font-light">{stat.value}</p>
              <p className="mt-1 text-sm text-muted">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Watchlist */}
        <section id="watchlist" className="mb-20 scroll-mt-8">
          <div className="mb-8 flex items-baseline justify-between border-b border-hairline pb-4">
            <h2 className="font-serif text-3xl font-light tracking-editorial">
              Watchlist
            </h2>
            <p className="text-xs uppercase tracking-[0.15em] text-faint">
              Live · Finnhub
            </p>
          </div>
          <WatchlistSection userId={user.id} />
        </section>

        {/* CTAs */}
        <section className="grid gap-px sm:grid-cols-2">
          <Link
            href="/dashboard/committee"
            className="group border-t border-hairline py-10 transition-colors sm:pr-10"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">
              The Committee
            </p>
            <h3 className="mb-3 font-serif text-2xl font-light transition-colors group-hover:text-gold">
              Convene a new analysis →
            </h3>
            <p className="text-pretty leading-relaxed text-muted">
              Five analysts debate your thesis; the chairman delivers a verdict.
            </p>
          </Link>
          <Link
            href="/dashboard/journal"
            className="group border-t border-hairline py-10 transition-colors sm:pl-10"
          >
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">
              The Journal
            </p>
            <h3 className="mb-3 font-serif text-2xl font-light transition-colors group-hover:text-gold">
              Log an investment idea →
            </h3>
            <p className="text-pretty leading-relaxed text-muted">
              Record theses and track them from watching to entry to exit.
            </p>
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
