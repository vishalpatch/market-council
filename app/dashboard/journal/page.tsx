import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import JournalClient from "@/components/journal/JournalClient";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <DashboardNav email={user.email} active="journal" />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-[#00dc82]">Trade Journal</p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">Your Journal</h1>
          <p className="max-w-2xl text-zinc-400">
            Log investment ideas, theses, and decisions. Track their status as you go
            from watching to entering to exiting a position.
          </p>
        </div>

        <JournalClient userId={user.id} />
      </main>
    </div>
  );
}
