import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import ConvictionClient from "@/components/conviction/ConvictionClient";

export default async function ConvictionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");


  return (
    <AppShell active="conviction" userEmail={user.email}>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Conviction Tracker
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Know Thyself
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Every committee analysis you save becomes a data point. Track your
            biases, your conviction, how often you side with the committee, and how
            your calls actually played out.
          </p>
        </header>

        <ConvictionClient />
      </main>
    </AppShell>
  );
}
