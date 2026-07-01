"use client";

import Link from "next/link";
import type { NavKey } from "./Sidebar";

const sv = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ITEMS: { key: NavKey; href: string; label: string; icon: React.ReactNode }[] = [
  {
    key: "committee",
    href: "/dashboard/committee",
    label: "Committee",
    icon: (
      <svg {...sv}>
        <path d="M12 3v18M12 6l-7 3 7 3 7-3-7-3Z" />
        <path d="M5 9v3.5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V9" />
      </svg>
    ),
  },
  {
    key: "digest",
    href: "/dashboard/digest",
    label: "Digest",
    icon: (
      <svg {...sv}>
        <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path d="M14 4v5h5" />
        <path d="M7 13h8M7 17h5" />
      </svg>
    ),
  },
  {
    key: "watchlist",
    href: "/dashboard#watchlist",
    label: "Watchlist",
    icon: (
      <svg {...sv}>
        <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    key: "journal",
    href: "/dashboard/journal",
    label: "Journal",
    icon: (
      <svg {...sv}>
        <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 19.5v-15Z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    ),
  },
  {
    key: "explorer",
    href: "/dashboard/explorer",
    label: "Explorer",
    icon: (
      <svg {...sv}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
];

export default function BottomNav({ active }: { active: NavKey }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-hairline bg-ink/95 backdrop-blur-xl md:hidden">
      {ITEMS.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
            active === it.key ? "text-gold" : "text-muted"
          }`}
        >
          <span className="flex h-6 w-6 items-center justify-center">{it.icon}</span>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
