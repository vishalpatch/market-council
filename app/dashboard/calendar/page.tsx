import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CalendarClient from "@/components/calendar/CalendarClient";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;

  return (
    <AppShell active="calendar" isAdmin={isAdmin}>
      <main className="mx-auto max-w-4xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Earnings & Catalysts
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            The Calendar
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Upcoming market-wide earnings and IPOs, grouped by day. Tickers on your
            watchlist are flagged, and you can add any to it in one click. AI
            briefings arrive once Anthropic credits are connected.
          </p>
        </header>

        <CalendarClient userId={user.id} />
      </main>
    </AppShell>
  );
}
