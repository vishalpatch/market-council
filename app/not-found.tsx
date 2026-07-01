import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--edge)] bg-[var(--surface)]">
        <span className="font-mono text-2xl font-bold text-muted">404</span>
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mb-8 max-w-sm text-muted text-sm">
        This page does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-[#c8a45d] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#c8a45d]/90"
      >
        Back to home
      </Link>
    </div>
  );
}
