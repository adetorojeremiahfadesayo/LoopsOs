import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "../components/Badge";
import { CogneeLifecycleStrip } from "../components/CogneeLifecycleStrip";
import { EmptyState } from "../components/EmptyState";
import { ImprovementReport } from "../components/ImprovementReport";
import { SectionHeader } from "../components/SectionHeader";
import type { AppState, LoopPlaybook, User, Workspace } from "../domain/types";
import type { LoopImprovementResult } from "../services/cognee";

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
  onRunAndRecallLoop: (loopId: string, patch: Partial<LoopPlaybook>) => void;
}) {
  const loops = state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate);
  const selectedLoop = loops.find((loop) => loop.id === selectedLoopId) ?? loops[0];
  const [goal, setGoal] = useState(selectedLoop?.goal ?? "");
  const [steps, setSteps] = useState(linesToText(selectedLoop?.steps ?? []));
  const [checks, setChecks] = useState(linesToText(selectedLoop?.validationChecks ?? []));
  const [memoryRules, setMemoryRules] = useState(linesToText(selectedLoop?.memoryRules ?? []));
  const [outputFormat, setOutputFormat] = useState(selectedLoop?.outputFormat ?? "");

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

  function runAndRecallLoop() {
    onRunAndRecallLoop(selectedLoop.id, {
      goal,
      steps: textToLines(steps),
      validationChecks: textToLines(checks),
      memoryRules: textToLines(memoryRules),
      outputFormat
    });
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

      <CogneeLifecycleStrip current={lastImprovement ? "improve" : "recall"} completed={["remember"]} />

      <section className="loop-card-bright rounded-2xl p-5">
        <button
          className="loop-primary-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold"
          onClick={runAndRecallLoop}
          type="button"
        >
          <Sparkles className="h-5 w-5" />
          Run and Recall Loop
          <ArrowRight className="h-5 w-5" />
        </button>
        <p className="mt-2 text-center text-xs leading-5 text-[#64748B]">
          Saves this loop, recalls Cognee context, then opens Agent Handoff.
        </p>
      </section>

      {lastImprovement ? <ImprovementReport improvement={lastImprovement} /> : null}
    </div>
  );
}
