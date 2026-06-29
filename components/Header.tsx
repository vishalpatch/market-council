import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 12L6 7L9 10L13 4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-50">
            Market Council
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
          <a href="#features" className="hover:text-zinc-50 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-zinc-50 transition-colors">
            How It Works
          </a>
          <Link
            href="/signup"
            className="px-4 py-1.5 rounded-full bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400 transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
