import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import StockSearch from "@/components/StockSearch";

export default async function ExplorerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppShell active="explorer" userEmail={user.email}>
      <main className="mx-auto max-w-5xl px-8 py-16 lg:px-12">
        <header className="mb-12 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">Stock Explorer</p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Look Anything Up
          </h1>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            Search any ticker for a live price, key fundamentals, an interactive chart,
            and the latest news.
          </p>
        </header>

        <StockSearch />
      </main>
    </AppShell>
  );
}
