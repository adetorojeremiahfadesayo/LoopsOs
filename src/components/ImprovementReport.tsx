import { BrainCircuit, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "./Badge";
import type { LoopImprovementResult } from "../services/cognee";

export function ImprovementReport({ improvement }: { improvement: LoopImprovementResult | null }) {
  if (!improvement) {
    return (
      <section className="rounded-lg border border-teal-200 bg-teal-50 p-5">
        <div className="flex items-center gap-2 text-teal-900">
          <BrainCircuit className="h-4 w-4" />
          <h3 className="font-semibold">Improvement Report</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-teal-950/80">
          Run and recall the loop to see what Cognee found, how the plan changed, and what should improve next.
        </p>
      </section>
    );
  }

  return (
    <section className="loop-card-bright rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#047857]">
            Improvement Report
          </p>
          <h3 className="mt-1 font-display text-xl font-bold text-[#111827]">How Cognee improved this loop</h3>
        </div>
        <Badge tone={improvement.recalled.mode === "live" ? "teal" : "amber"}>
          {improvement.recalled.mode === "live" ? "Cognee live" : "Demo fallback"}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
            Before Cognee
          </p>
          <p className="mt-2 text-sm leading-6 text-[#475569]">
            The loop only had its template files, current edits, and default runbook instructions.
          </p>
        </div>
        <div className="rounded-xl border border-[#B7F0D8] bg-[#ECFDF5] p-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#047857]">
            After Cognee
          </p>
          <p className="mt-2 text-sm leading-6 text-[#115E59]">
            The plan now includes recalled memory, run context, and improvement suggestions for the next agent handoff.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#B7F0D8] bg-[#ECFDF5] p-4">
          <div className="flex items-center gap-2 text-[#065F46]">
            <BrainCircuit className="h-4 w-4" />
            <p className="font-semibold">Memory recalled</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#115E59]">{improvement.recalled.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {improvement.recalled.sourceTitles.length > 0 ? (
              improvement.recalled.sourceTitles.map((title) => (
                <Badge key={title} tone="teal">
                  {title}
                </Badge>
              ))
            ) : (
              <Badge tone="amber">No memory found</Badge>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] p-4">
          <div className="flex items-center gap-2 text-[#0369A1]">
            <Sparkles className="h-4 w-4" />
            <p className="font-semibold">Plan improved</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#0F4264]">{improvement.generatedPlan}</p>
        </div>

        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
          <div className="flex items-center gap-2 text-[#92400E]">
            <CheckCircle2 className="h-4 w-4" />
            <p className="font-semibold">Next improvements</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#78350F]">
            {improvement.suggestions.map((suggestion) => (
              <li className="flex gap-2" key={suggestion}>
                <span aria-hidden="true">-</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
