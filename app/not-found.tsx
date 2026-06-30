import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
        <span className="font-mono text-2xl font-bold text-zinc-500">404</span>
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mb-8 max-w-sm text-zinc-400 text-sm">
        This page does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-[#00dc82] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#00dc82]/90"
      >
        Back to home
      </Link>
    </div>
  );
}
