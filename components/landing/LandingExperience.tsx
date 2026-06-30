"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

const ConsensusScene = dynamic(() => import("./ConsensusScene"), {
  ssr: false,
  loading: () => null,
});

function webglSupported() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/** Static aurora fallback when WebGL is unavailable or motion is reduced. */
function AuroraFallback() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute left-1/2 top-1/3 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(200,164,93,0.22),_transparent_60%)] blur-3xl" />
      <div className="absolute left-1/4 top-2/3 h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,_rgba(123,168,144,0.14),_transparent_60%)] blur-3xl" />
      <div className="absolute right-1/4 top-1/4 h-[36vh] w-[36vh] rounded-full bg-[radial-gradient(circle,_rgba(217,189,131,0.12),_transparent_60%)] blur-3xl" />
    </div>
  );
}

function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const PRINCIPLES = [
  {
    no: "01",
    title: "A council, not a chatbot",
    body: "Five specialized analysts — value, momentum, risk, contrarian, and macro — examine every thesis from their own discipline, then argue it out. You see each voice, not a flattened average.",
  },
  {
    no: "02",
    title: "Evidence over noise",
    body: "Live quotes, company fundamentals, and the week's headlines are pulled in and weighed. The council reasons from data, not vibes — and shows its work.",
  },
  {
    no: "03",
    title: "Conviction you can defend",
    body: "A chairman synthesizes the debate into a single verdict, a conviction score, and a recommendation you can export, file, and revisit when the facts change.",
  },
];

const STEPS = [
  {
    no: "01",
    title: "Submit a thesis",
    body: "A ticker, or a sentence. “Is Nvidia still a buy?” “Apple looks exposed to China.” The council convenes immediately.",
  },
  {
    no: "02",
    title: "The council deliberates",
    body: "Each analyst stress-tests your idea from a different angle — fundamental, technical, macro, and the devil's advocate who exists to disagree.",
  },
  {
    no: "03",
    title: "Receive a verdict",
    body: "A structured report: every analyst's stance, the chairman's synthesis, a conviction score, and the risks worth watching.",
  },
];

export default function LandingExperience() {
  const [mode, setMode] = useState<"loading" | "3d" | "fallback">("loading");
  const progressRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
  });

  useEffect(() => {
    function evaluate() {
      const supported = webglSupported();
      // Below ~1024px there are no real side gutters (large headline +
      // full-width mobile buttons), so the ribbons can't clear the text.
      const wideEnough = window.innerWidth >= 1024;
      setMode(reduceMotion || !supported || !wideEnough ? "fallback" : "3d");
    }
    evaluate();
    window.addEventListener("resize", evaluate);
    return () => window.removeEventListener("resize", evaluate);
  }, [reduceMotion]);

  return (
    <div className="relative">
      {/* Background layer */}
      {mode === "fallback" && <AuroraFallback />}
      {mode === "3d" && (
        <div className="fixed inset-0 z-0">
          <ConsensusScene progressRef={progressRef} />
        </div>
      )}

      {/* Legibility scrim — sits above the canvas, below the content */}
      {mode !== "loading" && (
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_42%,rgba(16,14,11,0.72),rgba(16,14,11,0.3)_55%,transparent_75%)]" />
      )}

      {/* Foreground content */}
      <div className="relative z-10">
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Reveal>
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold">
            <span className="h-1 w-1 rounded-full bg-gold" />
            Private Beta
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="font-serif text-6xl font-light leading-[0.95] tracking-editorial text-paper sm:text-8xl">
            Market Council
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-6 font-serif text-2xl italic text-gold sm:text-3xl">
            Your AI Investment Committee
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            A deliberative body of specialized AI analysts that debate your
            investment ideas — and a chairman who renders the verdict.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="w-full rounded-full bg-gold px-8 py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:bg-gold-soft sm:w-auto"
            >
              Convene Your Council
            </Link>
            <Link
              href="/login"
              className="w-full rounded-full border border-hairline-strong px-8 py-3.5 text-center text-sm font-medium text-paper transition-colors hover:border-gold hover:text-gold sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </Reveal>

      </section>

      {/* The Council */}
      <section className="relative mx-auto max-w-5xl px-6 py-32">
        <Reveal>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold">
            The Premise
          </p>
          <h2 className="mb-20 max-w-2xl font-serif text-4xl font-light leading-tight tracking-editorial sm:text-5xl">
            Built for investors who want a second opinion — and a third, and a fourth.
          </h2>
        </Reveal>

        <div className="space-y-px">
          {PRINCIPLES.map((p) => (
            <Reveal key={p.no}>
              <div className="grid grid-cols-1 gap-6 border-t border-hairline py-10 md:grid-cols-[80px_1fr_2fr]">
                <span className="font-mono text-sm text-gold">{p.no}</span>
                <h3 className="font-serif text-2xl font-light leading-snug">
                  {p.title}
                </h3>
                <p className="text-pretty leading-relaxed text-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative mx-auto max-w-5xl px-6 py-32">
        <Reveal>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-gold">
            The Method
          </p>
          <h2 className="mb-20 font-serif text-4xl font-light leading-tight tracking-editorial sm:text-5xl">
            Three steps from question to conviction.
          </h2>
        </Reveal>

        <div className="grid gap-px md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delay={i * 0.08}>
              <div className="flex h-full flex-col border-t border-hairline py-10 md:pr-8">
                <span className="mb-6 font-mono text-sm text-gold">{s.no}</span>
                <h3 className="mb-4 font-serif text-2xl font-light">{s.title}</h3>
                <p className="text-pretty leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-3xl px-6 py-40 text-center">
        <Reveal>
          <h2 className="font-serif text-5xl font-light leading-tight tracking-editorial sm:text-6xl">
            The committee is in session.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-pretty leading-relaxed text-muted">
            Bring an idea. Leave with a verdict you understand and can stand behind.
          </p>
          <Link
            href="/signup"
            className="mt-12 inline-block rounded-full bg-gold px-10 py-4 text-sm font-semibold text-ink transition-colors hover:bg-gold-soft"
          >
            Get Started
          </Link>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-hairline py-10 text-center text-sm text-faint">
        <p>&copy; {new Date().getFullYear()} Market Council. All rights reserved.</p>
      </footer>
      </div>
    </div>
  );
}
