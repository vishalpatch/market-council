"use client";

import Link from "next/link";

export default function UpgradeModal({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-gold/30 bg-ink-raised p-8 text-center shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-gold">Upgrade</p>
        <h2 className="mb-3 font-serif text-3xl font-light tracking-editorial">
          Unlock more
        </h2>
        <p className="mb-8 text-pretty leading-relaxed text-muted">{message}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft"
          >
            View Plans
          </Link>
          <button
            onClick={onClose}
            className="rounded-full border border-hairline-strong px-6 py-2.5 text-sm font-medium text-paper transition-colors hover:border-gold hover:text-gold"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
