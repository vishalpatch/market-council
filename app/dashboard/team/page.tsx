import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import TeamClient from "@/components/team/TeamClient";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell active="team" userEmail={user.email}>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Team</p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Your Desk
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Members, a shared chat with pinned announcements, and a manager view of
            everyone&apos;s recent activity.
          </p>
        </header>

        <TeamClient />
      </main>
    </AppShell>
  );
}
