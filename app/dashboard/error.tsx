"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10">
        <span className="text-2xl">⚠</span>
      </div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mb-2 max-w-sm text-zinc-400 text-sm">
        An error occurred loading this page.
      </p>
      {error.digest && (
        <p className="mb-6 font-mono text-xs text-zinc-600">Error ID: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-[#c8a45d] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#c8a45d]/90"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
