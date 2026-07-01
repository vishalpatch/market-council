import Link from "next/link";

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center text-gold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 18L9 10.5L13.5 15L21 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-serif text-lg tracking-editorial text-paper">
            Market Council
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/pricing"
            className="text-muted transition-colors hover:text-paper"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="hidden text-muted transition-colors hover:text-paper sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-hairline-strong px-4 py-1.5 font-medium text-paper transition-colors hover:border-gold hover:text-gold"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
