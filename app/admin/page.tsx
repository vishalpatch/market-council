import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AppShell from "@/components/AppShell";
import { isAdminEmail } from "@/lib/is-admin";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  const adminClient = createAdminClient();

  const [{ data: usersData }, { count: analysesCount }] = await Promise.all([
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
    adminClient
      .from("committee_analyses")
      .select("*", { count: "exact", head: true }),
  ]);

  const users = usersData?.users ?? [];

  return (
    <AppShell active="admin" userEmail={user.email}>
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
        <header className="mb-16 border-b border-hairline pb-12">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-gold">
            Admin Panel
          </p>
          <h1 className="font-serif text-5xl font-light leading-tight tracking-editorial">
            Overview
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted">
            Platform metrics and user management.
          </p>
        </header>

        {/* Stats */}
        <div className="mb-20 grid grid-cols-1 gap-px sm:grid-cols-3">
          {[
            { label: "Total Users", value: users.length.toLocaleString(), sub: "registered accounts" },
            { label: "Committee Analyses", value: (analysesCount ?? 0).toLocaleString(), sub: "total analyses run" },
            { label: "Admin", value: user.email ?? "—", sub: "current account" },
          ].map((s) => (
            <div key={s.label} className="border-t border-hairline pt-6 sm:pr-8">
              <p className="text-xs uppercase tracking-[0.15em] text-faint">{s.label}</p>
              <p className="mt-2 truncate font-serif text-3xl font-light">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <section>
          <div className="mb-6 flex items-baseline justify-between border-b border-hairline pb-4">
            <h2 className="font-serif text-3xl font-light tracking-editorial">
              Registered Users
            </h2>
            <span className="font-mono text-sm text-faint">{users.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  {["Email", "Name", "Signed Up", "Provider"].map((h) => (
                    <th
                      key={h}
                      className="py-3 pr-6 text-xs font-medium uppercase tracking-[0.15em] text-faint"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-faint">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-hairline/60 transition-colors hover:bg-paper/[0.02]"
                    >
                      <td className="py-4 pr-6 text-paper">{u.email ?? "—"}</td>
                      <td className="py-4 pr-6 text-muted">
                        {u.user_metadata?.full_name ?? "—"}
                      </td>
                      <td className="py-4 pr-6 font-mono text-xs text-faint">
                        {new Date(u.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4 pr-6">
                        <span className="rounded-full border border-hairline px-2.5 py-0.5 text-[11px] text-muted">
                          {u.app_metadata?.provider ?? "email"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
