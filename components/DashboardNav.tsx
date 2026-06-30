import Link from "next/link";
import { signOut } from "@/app/auth/actions";

type ActivePage = "dashboard" | "committee" | "journal";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:text-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
}

export default function DashboardNav({
  email,
  active,
}: {
  email?: string;
  active: ActivePage;
}) {
  return (
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

        <div className="flex items-center gap-2">
          {email && (
            <span className="mr-2 hidden text-sm text-zinc-400 sm:block">{email}</span>
          )}
          <NavLink href="/dashboard" active={active === "dashboard"}>
            Dashboard
          </NavLink>
          <NavLink href="/dashboard/journal" active={active === "journal"}>
            Journal
          </NavLink>
          <Link
            href="/dashboard/committee"
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active === "committee"
                ? "bg-[#00dc82] text-black"
                : "bg-[#00dc82] text-black hover:bg-[#00dc82]/90"
            }`}
          >
            Committee
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
  );
}
