import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import JournalClient from "@/components/journal/JournalClient";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");


  return (
    <AppShell active="journal" userEmail={user.email}>
      <main className="mx-auto max-w-4xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Trade Journal
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Your Journal
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Log investment ideas, theses, and decisions — and track each one from
            watching to entry to exit.
          </p>
        </header>

        <JournalClient userId={user.id} />
      </main>
    </AppShell>
  );
}
