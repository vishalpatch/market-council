import type { PersonaVerdict } from "@/lib/committee-types";
import { personaIcon } from "@/lib/committee-types";
import VerdictBadge from "./VerdictBadge";

export default function PersonaCard({ persona }: { persona: PersonaVerdict }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl transition-colors hover:border-white/[0.16]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-xl">
            {personaIcon(persona.name)}
          </div>
          <div>
            <h4 className="font-semibold leading-tight text-zinc-50">
              {persona.name}
            </h4>
            <p className="text-xs text-zinc-500">{persona.role}</p>
          </div>
        </div>
        <VerdictBadge verdict={persona.verdict} size="sm" />
      </div>

      {/* Confidence meter */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Confidence</span>
          <span className="font-mono text-zinc-300">{persona.confidence}/10</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[#00dc82] transition-all"
            style={{ width: `${(persona.confidence / 10) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-zinc-300">{persona.reasoning}</p>
    </div>
  );
}
