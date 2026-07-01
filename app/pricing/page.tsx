import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PricingClient from "@/components/pricing/PricingClient";

export const metadata = {
  title: "Pricing — Market Council",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="fixed top-0 z-50 w-full">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center text-gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M3 18L9 10.5L13.5 15L21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-serif text-lg tracking-editorial text-paper">Market Council</span>
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="text-sm text-muted transition-colors hover:text-paper"
          >
            {user ? "Dashboard" : "Sign In"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8">
        <div className="mb-14 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Pricing</p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial sm:text-6xl">
            Bring the whole committee.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Every plan includes the full suite of data tools, unlimited. Paid plans add
            the AI — the Committee, Devil&apos;s Advocate, and Market Pulse.
          </p>
        </div>

        <PricingClient isLoggedIn={!!user} />
      </main>
    </div>
  );
}
