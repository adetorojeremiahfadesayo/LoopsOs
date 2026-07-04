import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Clipboard, Code2, Download, FileArchive, Save, Terminal } from "lucide-react";
import { Badge } from "../components/Badge";
import { CogneeLifecycleStrip } from "../components/CogneeLifecycleStrip";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import type { AppState, Workspace } from "../domain/types";
import type { LoopImprovementResult } from "../services/cognee";
import { createAgentHandoff, type AgentTarget } from "../services/loopExport";

export function AgentHandoffPage({
  state,
  workspace,
  selectedLoopId,
  lastImprovement,
  onCompleteRun,
  onSelectLoop
}: {
  state: AppState;
  workspace: Workspace;
  selectedLoopId: string | null;
  lastImprovement: LoopImprovementResult | null;
  onCompleteRun: (input: {
    loopId: string;
    generatedPlan: string;
    retrievedMemorySourceIds: string[];
    outcomeNotes: string;
    improvementSuggestions: string[];
  }) => void;
  onSelectLoop: (loopId: string) => void;
}) {
  const loops = state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate);
  const selectedLoop = loops.find((loop) => loop.id === selectedLoopId) ?? loops[0];
  const [selectedAgent, setSelectedAgent] = useState<AgentTarget>("codex");
  const [handoffCopyStatus, setHandoffCopyStatus] = useState<string | null>(null);
  const [runNotes, setRunNotes] = useState("");
  const relevantRuns = useMemo(
    () => (selectedLoop ? state.runs.filter((run) => run.loopId === selectedLoop.id) : []),
    [selectedLoop, state.runs]
  );
  const visibleMemorySources = useMemo(
    () => state.memorySources.filter((source) => source.workspaceId === workspace.id),
    [state.memorySources, workspace.id]
  );
  const agentHandoff = useMemo(
    () =>
      selectedLoop
        ? createAgentHandoff(selectedLoop, selectedAgent, visibleMemorySources, relevantRuns, lastImprovement?.recalled.summary)
        : null,
    [lastImprovement?.recalled.summary, relevantRuns, selectedAgent, selectedLoop, visibleMemorySources]
  );

  if (!selectedLoop) {
    return <EmptyState title="No loop to hand off" body="Duplicate a template before sending a loop to an agent." />;
  }

  const generatedPlan =
    lastImprovement?.generatedPlan ??
    "Run and recall the loop before handoff to generate a permission-aware plan from visible memory.";

  const agentOptions: Array<{
    id: AgentTarget;
    label: string;
    body: string;
    icon: typeof Bot;
  }> = [
    {
      id: "codex",
      label: "Codex",
      body: "Best for repository edits, tests, and implementation tasks.",
      icon: Code2
    },
    {
      id: "claude",
      label: "Claude Code",
      body: "Good for long-form coding sessions with the same context bundle.",
      icon: Bot
    },
    {
      id: "generic",
      label: "Generic CLI",
      body: "Use the markdown bundle with any open model or terminal agent.",
      icon: Terminal
    }
  ];

  async function copyHandoff() {
    if (!agentHandoff) {
      return;
    }

    try {
      await navigator.clipboard.writeText(agentHandoff.content);
      setHandoffCopyStatus("Copied");
      window.setTimeout(() => setHandoffCopyStatus(null), 2200);
    } catch {
      setHandoffCopyStatus("Copy failed");
    }
  }

  function downloadHandoff() {
    if (!agentHandoff) {
      return;
    }

    const blob = new Blob([agentHandoff.content], { type: agentHandoff.mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = agentHandoff.filename;
    link.click();
    window.URL.revokeObjectURL(url);
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
    <div className="space-y-6">
      <section className="loop-card-bright rounded-2xl p-6">
        <SectionHeader
          title="Agent Handoff"
          body="Send generated markdown files, visible Cognee memory, and recent run history to an agent."
          action={agentHandoff ? <Badge tone="teal">{agentHandoff.filename}</Badge> : null}
        />
        <label className="mt-4 block max-w-xl">
          <span className="text-sm font-semibold text-[#111827]">Loop</span>
          <select
            className="mt-2 w-full rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm"
            onChange={(event) => onSelectLoop(event.target.value)}
            value={selectedLoop.id}
          >
            {loops.map((loop) => (
              <option key={loop.id} value={loop.id}>
                {loop.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <CogneeLifecycleStrip current="improve" completed={["remember", "recall"]} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-3">
          {agentOptions.map((agent) => {
            const Icon = agent.icon;
            const active = selectedAgent === agent.id;
            return (
              <button
                className={`rounded-lg border p-4 text-left transition ${
                  active
                    ? "border-[#10B981] bg-[#E7F8EF] text-[#111827]"
                    : "border-[#DDE5E1] bg-white text-[#64748B] hover:border-[#10B981]/50"
                }`}
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${active ? "text-[#047857]" : "text-[#64748B]"}`} />
                  <span className="font-display text-base font-bold text-[#111827]">{agent.label}</span>
                </span>
                <span className="mt-2 block text-sm leading-6">{agent.body}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.42fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-[#DDE5E1] bg-[#F6F8F7] p-4">
              <div className="flex items-center gap-2 text-[#111827]">
                <FileArchive className="h-4 w-4 text-[#047857]" />
                <p className="font-semibold">Bundle contents</p>
              </div>
              <div className="mt-3 space-y-2 text-sm text-[#64748B]">
                <p>{selectedLoop.loopFiles.length} markdown files</p>
                <p>{visibleMemorySources.length} visible Cognee memory sources</p>
                <p>{relevantRuns.length} saved run records</p>
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">CLI command</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-700 outline-none"
                readOnly
                value={agentHandoff?.command ?? ""}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                onClick={copyHandoff}
                type="button"
              >
                <Clipboard className="h-4 w-4" />
                {handoffCopyStatus ?? "Copy handoff"}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                onClick={downloadHandoff}
                type="button"
              >
                <Download className="h-4 w-4" />
                Download bundle
              </button>
            </div>

          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Handoff prompt preview</span>
            <textarea
              className="mt-2 min-h-[430px] w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs leading-5 text-slate-700 outline-none"
              readOnly
              value={agentHandoff?.content ?? ""}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader title="Finish Run" body={`${relevantRuns.length} previous run(s) saved for this loop.`} />
        <textarea
          className="min-h-32 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          onChange={(event) => setRunNotes(event.target.value)}
          placeholder="What happened? What should be saved for the next loop?"
          value={runNotes}
        />
        <button
          className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
          onClick={completeRun}
          type="button"
        >
          <Save className="h-4 w-4" />
          Finish Run
        </button>
        <p className="mt-2 text-xs leading-5 text-[#64748B]">
          Saves this outcome and opens the final Forget step.
        </p>
      </section>

      <section className="loop-card-bright rounded-2xl p-5">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#047857]">
                Handoff ready
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-[#111827]">Send this bundle to the agent</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
                The recall and improvement step is complete. Copy or download the bundle above, then finish the run notes.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#B8F3D5] bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#047857]">
              <CheckCircle2 className="h-4 w-4" />
              {selectedAgent === "generic" ? "CLI bundle prepared" : `${selectedAgent === "codex" ? "Codex" : "Claude"} bundle prepared`}
            </div>
          </div>

          <div className="border-t border-[#CDEFE0] pt-5">
            <div className="rounded-xl border border-[#BAE6FD] bg-white/75 p-4">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#0369A1]">
                Improved summary
              </p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#475569]">
                {lastImprovement
                  ? lastImprovement.generatedPlan
                  : "The agent bundle will include the improved plan after recall runs."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
