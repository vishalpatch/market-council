import type { Verdict } from "@/lib/committee-types";

const STYLES: Record<Verdict, string> = {
  BULLISH: "border-[#00dc82]/40 bg-[#00dc82]/10 text-[#00dc82]",
  BEARISH: "border-[#ff5470]/40 bg-[#ff5470]/10 text-[#ff5470]",
  NEUTRAL: "border-zinc-600/50 bg-zinc-500/10 text-zinc-300",
};

const GLYPH: Record<Verdict, string> = {
  BULLISH: "▲",
  BEARISH: "▼",
  NEUTRAL: "■",
};

export default function VerdictBadge({
  verdict,
  size = "md",
}: {
  verdict: Verdict;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider ${pad} ${STYLES[verdict]}`}
    >
      <span className="text-[0.7em]">{GLYPH[verdict]}</span>
      {verdict}
    </span>
  );
}
