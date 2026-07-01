import type { PersonaVerdict } from "@/lib/committee-types";
import { personaIcon } from "@/lib/committee-types";
import VerdictBadge from "./VerdictBadge";

export default function PersonaCard({ persona }: { persona: PersonaVerdict }) {
  return (
    <div className="rounded-2xl border border-[var(--edge)] bg-[var(--surface)] p-5 backdrop-blur-xl transition-colors hover:border-[var(--edge-2)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-xl">
            {personaIcon(persona.name)}
          </div>
          <div>
            <h4 className="font-semibold leading-tight text-paper">
              {persona.name}
            </h4>
            <p className="text-xs text-muted">{persona.role}</p>
          </div>
        </div>
        <VerdictBadge verdict={persona.verdict} size="sm" />
      </div>

      {/* Confidence meter */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span>Confidence</span>
          <span className="font-mono text-muted">{persona.confidence}/10</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full bg-[#c8a45d] transition-all"
            style={{ width: `${(persona.confidence / 10) * 100}%` }}
          />
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted">{persona.reasoning}</p>
    </div>
  );
}
