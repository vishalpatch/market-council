import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import RiskClient from "@/components/risk/RiskClient";

export default async function RiskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");


  return (
    <AppShell active="risk" userEmail={user.email}>
      <main className="mx-auto max-w-4xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Risk Simulator
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Size & Stress-Test
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Measure a position against the live price, size new trades by your
            risk-per-trade rule, and see how drawdowns would hit your capital — all
            calculated on the spot.
          </p>
        </header>

        <RiskClient />
      </main>
    </AppShell>
  );
}
