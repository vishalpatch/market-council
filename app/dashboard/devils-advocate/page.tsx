import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DevilsAdvocateClient from "@/components/devils-advocate/DevilsAdvocateClient";

export default async function DevilsAdvocatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell active="devils-advocate" userEmail={user.email}>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Devil&apos;s Advocate</p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Argue the Other Side
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            State your bull case. The AI argues the bear case against your exact points —
            not generic risks. Trade rebuttals for up to five rounds, then a neutral
            referee scores both sides and names the stronger argument.
          </p>
        </header>

        <DevilsAdvocateClient userId={user.id} />
      </main>
    </AppShell>
  );
}
