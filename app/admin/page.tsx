import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) redirect("/dashboard");

  const adminClient = createAdminClient();

  const [
    { data: usersData },
    { count: analysesCount },
  ] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    adminClient
      .from("committee_analyses")
      .select("*", { count: "exact", head: true }),
  ]);

  const users = usersData?.users ?? [];

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
          <span className="rounded-full border border-amber-600/40 bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-400">
            Admin
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-amber-400">Admin Panel</p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight">Overview</h1>
          <p className="text-zinc-400">Platform metrics and user management.</p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Users",
              value: users.length.toLocaleString(),
              sub: "registered accounts",
            },
            {
              label: "Committee Analyses",
              value: (analysesCount ?? 0).toLocaleString(),
              sub: "total analyses run",
            },
            {
              label: "Admin Email",
              value: adminEmail,
              sub: "current admin account",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <p className="mb-1 text-sm text-zinc-400">{s.label}</p>
              <p className="mb-1 truncate text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div>
          <p className="mb-4 text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Registered Users ({users.length})
          </p>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Signed Up
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Provider
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-600">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-zinc-900/40"
                    >
                      <td className="px-5 py-3.5 text-zinc-200">{u.email ?? "—"}</td>
                      <td className="px-5 py-3.5 text-zinc-400">
                        {u.user_metadata?.full_name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">
                        {new Date(u.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                          {u.app_metadata?.provider ?? "email"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
