import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Save, Sparkles } from "lucide-react";
import type { AppState, LoopPlaybook, RunRecord, User, Workspace } from "../domain/types";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
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
  onSelectLoop,
  onSaveLoop,
  onImproveLoop,
  onCompleteRun
}: {
  state: AppState;
  workspace: Workspace;
  user: User;
  selectedLoopId: string | null;
  lastImprovement: LoopImprovementResult | null;
  onSelectLoop: (loopId: string) => void;
  onSaveLoop: (loopId: string, patch: Partial<LoopPlaybook>) => void;
  onImproveLoop: (loopId: string) => void;
  onCompleteRun: (input: {
    loopId: string;
    generatedPlan: string;
    retrievedMemorySourceIds: string[];
    outcomeNotes: string;
    improvementSuggestions: string[];
  }) => void;
}) {
  const loops = state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate);
  const selectedLoop = loops.find((loop) => loop.id === selectedLoopId) ?? loops[0];
  const [goal, setGoal] = useState(selectedLoop?.goal ?? "");
  const [steps, setSteps] = useState(linesToText(selectedLoop?.steps ?? []));
  const [checks, setChecks] = useState(linesToText(selectedLoop?.validationChecks ?? []));
  const [memoryRules, setMemoryRules] = useState(linesToText(selectedLoop?.memoryRules ?? []));
  const [outputFormat, setOutputFormat] = useState(selectedLoop?.outputFormat ?? "");
  const [runNotes, setRunNotes] = useState("");

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

  const relevantRuns = useMemo(
    () => (selectedLoop ? state.runs.filter((run) => run.loopId === selectedLoop.id) : []),
    [selectedLoop, state.runs]
  );

  if (!selectedLoop) {
    return (
      <EmptyState
        title="No loops yet"
        body="Duplicate a template to start building a memory-backed loop playbook."
      />
    );
  }

  const generatedPlan =
    lastImprovement?.generatedPlan ??
    "Ask Cognee to improve this loop to generate a permission-aware plan from visible memory.";

  function saveLoop() {
    onSaveLoop(selectedLoop.id, {
      goal,
      steps: textToLines(steps),
      validationChecks: textToLines(checks),
      memoryRules: textToLines(memoryRules),
      outputFormat
    });
  }

  function completeRun() {
    if (!runNotes.trim()) {
      return;
    }
    onCompleteRun({
      loopId: selectedLoop.id,
      generatedPlan,
      retrievedMemorySourceIds: lastImprovement?.recalled.sourceIds ?? [],
      outcomeNotes: runNotes.trim(),
      improvementSuggestions: lastImprovement?.suggestions ?? ["Save a reflection note after every run."]
    });
    setRunNotes("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader title="Workspace Loops" body="Select a playbook to edit or improve." />
        <div className="space-y-2">
          {loops.map((loop) => (
            <button
              className={`w-full rounded-lg border p-4 text-left transition ${
                loop.id === selectedLoop.id
                  ? "border-teal-300 bg-teal-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              key={loop.id}
              onClick={() => onSelectLoop(loop.id)}
              type="button"
            >
              <p className="font-semibold text-slate-950">{loop.name}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{loop.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {loop.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                onClick={saveLoop}
                type="button"
              >
                <Save className="h-4 w-4" />
                Save loop
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
                onClick={() => onImproveLoop(selectedLoop.id)}
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                Improve with Cognee
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
            <div className="flex items-center gap-2 text-teal-900">
              <BrainCircuit className="h-4 w-4" />
              <h3 className="font-semibold">Generated Plan</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-teal-950/80">{generatedPlan}</p>
            {lastImprovement ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Recalled memory</p>
                <div className="flex flex-wrap gap-2">
                  {lastImprovement.recalled.sourceTitles.map((title) => (
                    <Badge key={title} tone="teal">
                      {title}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader title="Complete Run" body={`${relevantRuns.length} previous run(s) saved for this loop.`} />
            <textarea
              className="min-h-32 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setRunNotes(event.target.value)}
              placeholder="What happened? What should Cognee remember?"
              value={runNotes}
            />
            <button
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
              onClick={completeRun}
              type="button"
            >
              <Save className="h-4 w-4" />
              Save run notes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
