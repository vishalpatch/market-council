"use client";

import { useEffect } from "react";

export default function GlobalError({
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
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#ff5470]/30 bg-[#ff5470]/10">
        <span className="text-2xl">⚠</span>
      </div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mb-8 max-w-sm text-zinc-400 text-sm">
        An unexpected error occurred. Try refreshing, or go back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-[#00dc82] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#00dc82]/90"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-xl border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
