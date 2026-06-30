import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import CommitteeClient from "@/components/committee/CommitteeClient";

export default async function CommitteePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <DashboardNav email={user.email} active="committee" />

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
