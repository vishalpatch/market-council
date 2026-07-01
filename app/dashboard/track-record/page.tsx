import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import TrackRecordClient from "@/components/track-record/TrackRecordClient";

export default async function TrackRecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell active="track-record" userEmail={user.email}>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Track Record</p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Were You Right?
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            A living scorecard. Every committee thesis with a ticker is price-stamped at
            submission, then measured against the live price over 30, 60, and 90 days —
            so you can see, honestly, how your calls played out.
          </p>
        </header>

        <TrackRecordClient />
      </main>
    </AppShell>
  );
}
