"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Sign in failed.");
        setLoading(false);
        return;
      }
      // Hard redirect so the server re-reads the fresh session cookie.
      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 text-paper editorial-vignette">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-12 flex items-center justify-center gap-2.5">
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
          <span className="font-serif text-lg tracking-editorial">Market Council</span>
        </Link>

        <h1 className="mb-2 font-serif text-4xl font-light tracking-editorial">
          Welcome back
        </h1>
        <p className="mb-10 text-sm text-muted">Sign in to convene your council.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-faint">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border-b border-hairline-strong bg-transparent py-2.5 text-paper placeholder-faint transition-colors focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-faint">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border-b border-hairline-strong bg-transparent py-2.5 text-paper placeholder-faint transition-colors focus:border-gold focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-down/30 bg-down/10 px-4 py-2.5 text-sm text-down">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gold py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-gold transition-colors hover:text-gold-soft">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
