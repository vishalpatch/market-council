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
    <div className="min-h-screen bg-ink text-paper flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cb7e68]/30 bg-[#cb7e68]/10">
        <span className="text-2xl">⚠</span>
      </div>
      <h1 className="mb-3 text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mb-8 max-w-sm text-muted text-sm">
        An unexpected error occurred. Try refreshing, or go back to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-[#c8a45d] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#c8a45d]/90"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-xl border border-hairline-strong px-6 py-2.5 text-sm font-medium text-muted transition-colors hover:border-hairline-strong hover:text-paper"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
}
