import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import AnalyticsClient from "@/components/analytics/AnalyticsClient";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");


  return (
    <AppShell active="analytics" userEmail={user.email}>
      <main className="mx-auto max-w-4xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Performance Analytics
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Your Track Record
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Patterns drawn from your trade journal — activity over time, win rate
            on closed positions, and where your conviction concentrates.
          </p>
        </header>

        <AnalyticsClient />
      </main>
    </AppShell>
  );
}
