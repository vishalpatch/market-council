import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import InvestmentProfileClient from "@/components/profile/InvestmentProfileClient";

export default async function InvestmentProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell active="investment-profile" userEmail={user.email}>
      <main className="mx-auto max-w-3xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Your Investment Profile
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            How You Actually Invest
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Not a quiz — a portrait inferred from your real behavior across the app:
            the theses you run, the trades you log, the names you watch, and the
            portfolios you stress-test.
          </p>
        </header>

        <InvestmentProfileClient />
      </main>
    </AppShell>
  );
}
