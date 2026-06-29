import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import CommitteeClient from "@/components/committee/CommitteeClient";

export default async function CommitteePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 12L6 7L9 10L13 4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">Market Council</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 transition-colors hover:text-zinc-50"
            >
              Dashboard
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-[#00dc82]">AI Investment Committee</p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">The Committee</h1>
          <p className="max-w-2xl text-zinc-400">
            Submit a ticker or an investment thesis. Five specialized AI analysts — a value
            investor, a momentum trader, a risk manager, a contrarian, and a macro
            economist — each weigh in, then the Chairman delivers a final verdict.
          </p>
        </div>

        <CommitteeClient userId={user.id} />
      </main>
    </div>
  );
}
