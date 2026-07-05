import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "../components/Badge";
import { CogneeLifecycleStrip } from "../components/CogneeLifecycleStrip";
import { EmptyState } from "../components/EmptyState";
import { ImprovementReport } from "../components/ImprovementReport";
import { SectionHeader } from "../components/SectionHeader";
import type { AppState, LoopPlaybook, User, Workspace } from "../domain/types";
import type { LoopImprovementResult } from "../services/cognee";

const demoImprovementSuggestion =
  "Make the agent stricter about mobile responsiveness, accessibility checks, and avoiding fake UI controls before handoff.";

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function LoopBuilderHandoffReady({ improvement }: { improvement: LoopImprovementResult }) {
  return (
    <section className="loop-card-bright rounded-2xl p-5">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#047857]">
              Handoff ready
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-[#111827]">Send this bundle to the agent</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
              The recall and improvement step is complete. Open Agent Handoff to copy or download the prepared bundle.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B8F3D5] bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#047857]">
            <CheckCircle2 className="h-4 w-4" />
            Codex bundle prepared
          </div>
        </div>

        <div className="border-t border-[#CDEFE0] pt-5">
          <div className="rounded-xl border border-[#BAE6FD] bg-white/75 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#0369A1]">
              Improved summary
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#475569]">{improvement.generatedPlan}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LoopBuilder({
  state,
  workspace,
  user,
  selectedLoopId,
  lastImprovement,
  onRunAndRecallLoop
}: {
  state: AppState;
  workspace: Workspace;
  user: User;
  selectedLoopId: string | null;
  lastImprovement: LoopImprovementResult | null;
  onRunAndRecallLoop: (loopId: string, patch: Partial<LoopPlaybook>, improvementPrompt: string) => void;
}) {
  const loops = state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate);
  const selectedLoop = loops.find((loop) => loop.id === selectedLoopId) ?? loops[0];
  const [goal, setGoal] = useState(selectedLoop?.goal ?? "");
  const [steps, setSteps] = useState(linesToText(selectedLoop?.steps ?? []));
  const [checks, setChecks] = useState(linesToText(selectedLoop?.validationChecks ?? []));
  const [memoryRules, setMemoryRules] = useState(linesToText(selectedLoop?.memoryRules ?? []));
  const [outputFormat, setOutputFormat] = useState(selectedLoop?.outputFormat ?? "");
  const [improvementPrompt, setImprovementPrompt] = useState("");

  useEffect(() => {
    if (!selectedLoop) {
      return;
    }
    setGoal(selectedLoop.goal);
    setSteps(linesToText(selectedLoop.steps));
    setChecks(linesToText(selectedLoop.validationChecks));
    setMemoryRules(linesToText(selectedLoop.memoryRules));
    setOutputFormat(selectedLoop.outputFormat);
  }, [selectedLoop]);

  if (!selectedLoop) {
    return (
      <EmptyState
        title="No loops yet"
        body="Duplicate a template to start building a memory-backed loop playbook."
      />
    );
  }

  function improveSelectedLoop() {
    onRunAndRecallLoop(
      selectedLoop.id,
      {
        goal,
        steps: textToLines(steps),
        validationChecks: textToLines(checks),
        memoryRules: textToLines(memoryRules),
        outputFormat
      },
      improvementPrompt.trim()
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader
          title={selectedLoop.name}
          body={`Editing as ${user.name}. Every save creates a versioned audit event.`}
          action={<Badge tone="amber">v{selectedLoop.version}</Badge>}
        />
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Goal</span>
            <textarea
              className="mt-2 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setGoal(event.target.value)}
              value={goal}
            />
          </label>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Loop steps</span>
              <textarea
                className="mt-2 min-h-48 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setSteps(event.target.value)}
                value={steps}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Validation checks</span>
              <textarea
                className="mt-2 min-h-48 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setChecks(event.target.value)}
                value={checks}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Memory rules</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setMemoryRules(event.target.value)}
              value={memoryRules}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Output format</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setOutputFormat(event.target.value)}
              value={outputFormat}
            />
          </label>
        </div>
      </section>

      <section className="loop-card-bright rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#047857]">
              Improve this loop
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-[#111827]">Tell the agent what to tighten</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
              Add a specific improvement request before running the loop. LoopOS applies it with recalled Cognee
              context and explains the change in the report.
            </p>
          </div>
          <button
            className="rounded-lg border border-[#BFE9D6] bg-white px-3 py-2 text-sm font-semibold text-[#047857] shadow-sm"
            onClick={() => setImprovementPrompt(demoImprovementSuggestion)}
            type="button"
          >
            Use demo suggestion
          </button>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-[#334155]">Suggest an improvement</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-[#DDE5E1] bg-white px-3 py-2 text-sm leading-6 text-[#111827] outline-none transition focus:border-[#34D399] focus:ring-2 focus:ring-[#CFF7E4]"
            onChange={(event) => setImprovementPrompt(event.target.value)}
            placeholder="Example: make the agent stricter about accessibility, tests, or deployment checks."
            value={improvementPrompt}
          />
        </label>
      </section>

      <CogneeLifecycleStrip current={lastImprovement ? "improve" : "recall"} completed={["remember"]} />

      <section className="loop-card-bright rounded-2xl p-5">
        <button
          className="loop-primary-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold"
          onClick={improveSelectedLoop}
          type="button"
        >
          <Sparkles className="h-5 w-5" />
          Improve Loop
          <ArrowRight className="h-5 w-5" />
        </button>
        <p className="mt-2 text-center text-xs leading-5 text-[#64748B]">
          Applies your suggestion, recalls Cognee context, then opens Agent Handoff.
        </p>
      </section>

      {lastImprovement ? (
        <>
          <ImprovementReport improvement={lastImprovement} />
          <LoopBuilderHandoffReady improvement={lastImprovement} />
        </>
      ) : null}
    </div>
  );
}
