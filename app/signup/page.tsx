"use client";

import { useState } from "react";
import Link from "next/link";
import { isPasswordPwned } from "@/lib/pwned";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Leaked-password check (privacy-preserving, client-side k-anonymity).
    if (await isPasswordPwned(password)) {
      setError(
        "This password has appeared in known data breaches. Please choose a different one."
      );
      setLoading(false);
      return;
    }

    // 2. Create the account via the rate-limited server endpoint.
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Sign up failed.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-4 text-paper editorial-vignette">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13L9 17L19 7"
                stroke="var(--gold)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="mb-2 font-serif text-3xl font-light tracking-editorial">
            Check your email
          </h2>
          <p className="mb-6 text-sm text-muted">
            We sent a confirmation link to{" "}
            <span className="text-paper">{email}</span>. Click it to activate your
            account.
          </p>
          <Link
            href="/login"
            className="text-sm text-gold transition-colors hover:text-gold-soft"
          >
            Back to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-12 text-paper editorial-vignette">
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
          Create an account
        </h1>
        <p className="mb-10 text-sm text-muted">Join the investment committee.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.15em] text-faint">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full border-b border-hairline-strong bg-transparent py-2.5 text-paper placeholder-faint transition-colors focus:border-gold focus:outline-none"
            />
          </div>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border-b border-hairline-strong bg-transparent py-2.5 text-paper placeholder-faint transition-colors focus:border-gold focus:outline-none"
            />
            <p className="mt-2 text-xs text-faint">
              Minimum 6 characters · checked against known breaches
            </p>
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-gold transition-colors hover:text-gold-soft">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
