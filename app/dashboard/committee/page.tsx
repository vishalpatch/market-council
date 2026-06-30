import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CommitteeClient from "@/components/committee/CommitteeClient";

export default async function CommitteePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");


  return (
    <AppShell active="committee" userEmail={user.email}>
      <main className="mx-auto max-w-6xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            AI Investment Committee
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            The Committee
          </h1>
          <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted">
            Submit a ticker or an investment thesis. Five specialized analysts — a
            value investor, a momentum trader, a risk manager, a contrarian, and a
            macro economist — each weigh in, then the Chairman delivers a verdict.
          </p>
        </header>

        <CommitteeClient userId={user.id} />
      </main>
    </AppShell>
  );
}
