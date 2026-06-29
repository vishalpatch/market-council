import Link from "next/link";
import Header from "@/components/Header";
import { SITE_TAGLINE, SITE_DESCRIPTION } from "@/lib/constants";

const features = [
  {
    icon: "🧠",
    title: "Multi-Agent Analysis",
    description:
      "A council of specialized AI agents debates every investment thesis — bull, bear, and risk perspectives included.",
  },
  {
    icon: "📊",
    title: "Real-Time Data",
    description:
      "Live market feeds, earnings transcripts, and macro indicators synthesized into actionable signals.",
  },
  {
    icon: "⚖️",
    title: "Institutional Rigor",
    description:
      "Portfolio construction and risk management frameworks modeled after leading hedge funds.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-zinc-950 to-zinc-950 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-800 bg-emerald-950/50 text-emerald-400 text-xs font-medium mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Now in Private Beta
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-balance mb-6">
            Market Council
          </h1>
          <p className="text-xl sm:text-2xl text-emerald-400 font-medium mb-4">
            {SITE_TAGLINE}
          </p>
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg leading-relaxed mb-12">
            {SITE_DESCRIPTION}
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            id="get-started"
          >
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 transition-colors text-base text-center"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-zinc-700 text-zinc-300 font-semibold hover:border-zinc-500 hover:text-zinc-50 transition-colors text-base text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4 tracking-tight">
          Built for serious investors
        </h2>
        <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
          Every feature is designed to sharpen your edge, not replace your judgment.
        </p>
        <div className="grid sm:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-zinc-800 bg-zinc-900/30"
      >
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">How It Works</h2>
          <p className="text-zinc-400 mb-16 max-w-xl mx-auto">
            Three steps from question to conviction.
          </p>
          <ol className="grid sm:grid-cols-3 gap-8 text-left">
            {[
              {
                step: "01",
                title: "Submit a Thesis",
                body: "Describe an investment idea or paste a ticker. The council begins research immediately.",
              },
              {
                step: "02",
                title: "Council Deliberates",
                body: "Specialized agents stress-test your thesis from every angle — macro, fundamental, and technical.",
              },
              {
                step: "03",
                title: "Receive a Verdict",
                body: "Get a structured report with a conviction score, key risks, and suggested position sizing.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="text-emerald-500 font-mono font-bold text-lg shrink-0 mt-0.5">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 text-center text-zinc-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Market Council. All rights reserved.</p>
      </footer>
    </div>
  );
}
