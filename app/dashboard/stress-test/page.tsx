import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import StressTestClient from "@/components/stress/StressTestClient";

export default async function StressTestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");


  return (
    <AppShell active="stress-test" userEmail={user.email}>
      <main className="mx-auto max-w-5xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Portfolio Stress Test
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Survive the Storm
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Build a portfolio and replay it through the great market crises — 2008,
            COVID, the dot-com bust, and 2022 — to see where it&apos;s fragile and how
            concentrated your risk really is.
          </p>
        </header>

        <StressTestClient userId={user.id} />
      </main>
    </AppShell>
  );
}
