"use client";

import Link from "next/link";
import { signOut } from "@/app/auth/actions";

export type NavKey =
  | "dashboard"
  | "digest"
  | "watchlist"
  | "journal"
  | "analytics"
  | "conviction"
  | "sentiment"
  | "risk"
  | "stress-test"
  | "calendar"
  | "committee"
  | "admin";

function Icon({ name }: { name: NavKey | "logo" | "signout" }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "logo":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 18L9 10.5L13.5 15L21 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "watchlist":
      return (
        <svg {...common}>
          <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "journal":
      return (
        <svg {...common}>
          <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 19.5v-15Z" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...common}>
          <path d="M4 20V13M9 20V7M14 20V11M19 20V5" />
          <path d="M3 20h18" />
        </svg>
      );
    case "sentiment":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
      );
    case "risk":
      return (
        <svg {...common}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="2" y1="14" x2="6" y2="14" />
          <line x1="10" y1="8" x2="14" y2="8" />
          <line x1="18" y1="16" x2="22" y2="16" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
        </svg>
      );
    case "digest":
      return (
        <svg {...common}>
          <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
          <path d="M14 4v5h5" />
          <path d="M7 13h8M7 17h5" />
        </svg>
      );
    case "conviction":
      return (
        <svg {...common}>
          <path d="M20.8 6.6a5 5 0 0 0-7.1 0L12 8.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 22l8.8-8.3a5 5 0 0 0 0-7.1Z" />
        </svg>
      );
    case "stress-test":
      return (
        <svg {...common}>
          <path d="M3 13h3l2-7 4 14 2-7h2" />
          <path d="M18 13h3" />
        </svg>
      );
    case "committee":
      return (
        <svg {...common}>
          <path d="M12 3v18M12 6l-7 3 7 3 7-3-7-3Z" />
          <path d="M5 9v3.5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V9" />
        </svg>
      );
    case "admin":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
          <path d="M9.5 12l1.8 1.8L15 10" />
        </svg>
      );
    case "signout":
      return (
        <svg {...common}>
          <path d="M15 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
          <path d="M11 12h9M17 8l4 4-4 4" />
        </svg>
      );
  }
}

interface ItemProps {
  href: string;
  label: string;
  icon: NavKey;
  active: boolean;
}

function NavItem({ href, label, icon, active }: ItemProps) {
  return (
    <Link
      href={href}
      className={`group/item relative flex h-11 items-center gap-4 rounded-xl px-3 transition-colors ${
        active
          ? "bg-gold/[0.12] text-gold"
          : "text-muted hover:bg-paper/[0.04] hover:text-paper"
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        <Icon name={icon} />
      </span>
      <span className="whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gold" />
      )}
    </Link>
  );
}

export default function Sidebar({
  active,
  isAdmin = false,
}: {
  active: NavKey;
  isAdmin?: boolean;
}) {
  return (
    <aside className="group fixed left-0 top-0 z-50 flex h-screen w-[68px] flex-col border-r border-hairline bg-ink/95 px-3 py-5 backdrop-blur-xl transition-[width] duration-300 ease-out hover:w-56">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-8 flex h-10 items-center gap-3 rounded-xl px-3 text-gold"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">
          <Icon name="logo" />
        </span>
        <span className="whitespace-nowrap font-serif text-lg tracking-editorial text-paper opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          Market Council
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        <NavItem href="/dashboard" label="Dashboard" icon="dashboard" active={active === "dashboard"} />
        <NavItem href="/dashboard/digest" label="Morning Digest" icon="digest" active={active === "digest"} />
        <NavItem href="/dashboard#watchlist" label="Watchlist" icon="watchlist" active={active === "watchlist"} />
        <NavItem href="/dashboard/journal" label="Journal" icon="journal" active={active === "journal"} />
        <NavItem href="/dashboard/analytics" label="Analytics" icon="analytics" active={active === "analytics"} />
        <NavItem href="/dashboard/conviction" label="Conviction" icon="conviction" active={active === "conviction"} />
        <NavItem href="/dashboard/sentiment" label="Market Pulse" icon="sentiment" active={active === "sentiment"} />
        <NavItem href="/dashboard/risk" label="Risk Simulator" icon="risk" active={active === "risk"} />
        <NavItem href="/dashboard/stress-test" label="Stress Test" icon="stress-test" active={active === "stress-test"} />
        <NavItem href="/dashboard/calendar" label="Calendar" icon="calendar" active={active === "calendar"} />
        <NavItem href="/dashboard/committee" label="Committee" icon="committee" active={active === "committee"} />
        {isAdmin && (
          <NavItem href="/admin" label="Admin" icon="admin" active={active === "admin"} />
        )}
      </nav>

      {/* Sign out */}
      <form action={signOut} className="mt-auto">
        <button
          type="submit"
          className="group/item flex h-11 w-full items-center gap-4 rounded-xl px-3 text-muted transition-colors hover:bg-paper/[0.04] hover:text-down"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon name="signout" />
          </span>
          <span className="whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Sign Out
          </span>
        </button>
      </form>
    </aside>
  );
}
