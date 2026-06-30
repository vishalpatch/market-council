import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import SentimentClient from "@/components/sentiment/SentimentClient";

export default async function SentimentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isAdmin = !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL;

  return (
    <AppShell active="sentiment" isAdmin={isAdmin}>
      <main className="mx-auto max-w-4xl px-8 py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Sentiment War-Room
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Read the Tape
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Enter a ticker. We pull its recent headlines and have Claude gauge the
            near-term sentiment — bullish, bearish, or neutral — with a plain-English
            read on why the stock might be moving.
          </p>
        </header>

        <SentimentClient />
      </main>
    </AppShell>
  );
}
