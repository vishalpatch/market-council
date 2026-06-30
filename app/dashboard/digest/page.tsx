import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import DigestClient from "@/components/digest/DigestClient";

export default async function DigestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;
  const displayName = user.user_metadata?.full_name ?? user.email ?? "Investor";

  return (
    <AppShell active="digest" isAdmin={isAdmin}>
      <main className="mx-auto max-w-4xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Morning Digest
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Good morning, {displayName.split(" ")[0]}.
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Your watchlist, ranked by what needs your attention today — the big
            movers, the news spikes, and the names testing their 52-week extremes.
          </p>
        </header>

        <DigestClient />
      </main>
    </AppShell>
  );
}
