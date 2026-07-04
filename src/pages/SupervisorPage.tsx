import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  ChevronDown,
  ClipboardCheck,
  Code2,
  Eye,
  GitCompareArrows,
  Play,
  Radio,
  ShieldCheck,
  Siren,
  Sparkles,
  Terminal,
  Timer
} from "lucide-react";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import type { AppState, AuditEvent, RunRecord, Workspace } from "../domain/types";

interface AgentLane {
  id: "codex" | "claude";
  name: string;
  role: string;
  loopName: string;
  summary: string;
  signals: string[];
  pulse: string;
  icon: typeof Bot;
}

interface LiveEvent {
  id: string;
  title: string;
  body: string;
  meta: string;
  createdAt: string;
  type: "live";
}

function formatAction(action: AuditEvent["action"]) {
  return action
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function recentRunSummary(run: RunRecord | undefined) {
  if (!run) {
    return "No saved run yet. Activate monitoring to attach the supervisor to this workflow.";
  }

  return run.outcomeNotes;
}

export function SupervisorPage({
  state,
  workspace,
  onContinue
}: {
  state: AppState;
  workspace: Workspace;
  onContinue: () => void;
}) {
  const [guardrailsOpen, setGuardrailsOpen] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  const loops = state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate);
  const runs = state.runs.filter((run) => run.workspaceId === workspace.id).slice().reverse();
  const auditEvents = state.auditEvents.filter((event) => event.workspaceId === workspace.id).slice().reverse();
  const memorySources = state.memorySources.filter((source) => source.workspaceId === workspace.id);
  const restrictedMemoryCount = memorySources.filter((source) => source.access.visibility === "restricted").length;
  const ingestedMemoryCount = memorySources.filter((source) => source.ingestionStatus === "ingested").length;
  const latestRun = runs[0];
  const latestLoop = latestRun ? loops.find((loop) => loop.id === latestRun.loopId) : loops[0];
  const secondLoop = loops.find((loop) => loop.id !== latestLoop?.id) ?? latestLoop;

  const agentLanes: AgentLane[] = [
    {
      id: "codex",
      name: "Codex",
      role: "Implementation runner",
      loopName: latestLoop?.name ?? "No active loop",
      summary: recentRunSummary(latestRun),
      signals: [
        `${runs.length} saved run${runs.length === 1 ? "" : "s"} reviewed`,
        `${auditEvents.length} audit event${auditEvents.length === 1 ? "" : "s"} scanned`,
        `${ingestedMemoryCount} Cognee memor${ingestedMemoryCount === 1 ? "y" : "ies"} ready`
      ],
      pulse: "Applying loop files and test discipline",
      icon: Code2
    },
    {
      id: "claude",
      name: "Claude Architect",
      role: "Parallel reviewer",
      loopName: secondLoop?.name ?? "No active loop",
      summary:
        secondLoop && latestLoop
          ? "Compares long-context reasoning against Codex output as the workflow produces new logs."
          : "Connect another handoff or import a log to compare two agents side by side.",
      signals: [
        "Cross-agent disagreement checks armed",
        "Loop drift warnings enabled",
        "Final approval gate visible"
      ],
      pulse: "Watching for contradictions and missing context",
      icon: BrainCircuit
    }
  ];

  const guardrails = [
    {
      title: "Require approval for high-risk actions",
      body: "Warn before agents delete files, change auth or security code, expose secrets, or ship without tests.",
      icon: Siren,
      tone: "amber" as const
    },
    {
      title: "Keep agents inside the approved loop",
      body: "Compare activity against loop files, validation checks, and remembered Cognee constraints.",
      icon: ClipboardCheck,
      tone: "teal" as const
    },
    {
      title: "Detect disagreement between agents",
      body: "When two agents are active, surface conflicting plans, repeated blockers, and mismatched conclusions.",
      icon: GitCompareArrows,
      tone: "green" as const
    }
  ];

  const activityItems = useMemo(
    () =>
      [
        ...liveEvents,
        ...runs.map((run) => ({
          id: run.id,
          title: loops.find((loop) => loop.id === run.loopId)?.name ?? "Unknown loop",
          body: run.generatedPlan,
          meta: `Run completed by ${state.users.find((user) => user.id === run.actorId)?.name ?? "Unknown user"}`,
          createdAt: run.createdAt,
          type: "run" as const
        })),
        ...auditEvents.map((event) => ({
          id: event.id,
          title: event.targetName,
          body: event.afterSummary ?? event.beforeSummary ?? formatAction(event.action),
          meta: formatAction(event.action),
          createdAt: event.createdAt,
          type: "audit" as const
        }))
      ]
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 6),
    [auditEvents, liveEvents, loops, runs, state.users]
  );

  function activateWorkflow() {
    const createdAt = new Date().toISOString();
    setMonitoringActive(true);
    setLiveEvents((current) => [
      {
        id: `live-${Date.now()}`,
        title: "Live monitor attached",
        body: "Supervisor started streaming Codex and Claude Architect activity for this workflow.",
        meta: "Live signal",
        createdAt,
        type: "live"
      },
      ...current
    ]);
  }

  if (loops.length === 0 && runs.length === 0 && auditEvents.length === 0) {
    return (
      <EmptyState
        title="No loops to supervise"
        body="Duplicate a template, run a handoff, or import an agent log to start supervisor oversight."
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="loop-card-bright overflow-hidden rounded-2xl p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#111827]">Supervisor</h1>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">
                  Senior AI engineer oversight for active agent loops.
                </p>
              </div>
              <Badge tone={monitoringActive ? "green" : "teal"}>
                {monitoringActive ? "live monitoring" : `${agentLanes.length} agents monitored`}
              </Badge>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {[
                ["Loops", loops.length],
                ["Runs", runs.length],
                ["Memory", ingestedMemoryCount],
                ["Events", auditEvents.length + liveEvents.length]
              ].map(([label, value]) => (
                <div className="rounded-lg border border-[#DDE5E1] bg-white/90 p-3" key={label}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
                  <p className="mt-2 font-display text-xl font-bold text-[#111827]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                className="loop-primary-button inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                onClick={activateWorkflow}
                type="button"
              >
                <Play className="h-4 w-4" />
                {monitoringActive ? "Refresh live monitor" : "Activate workflow"}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-[#BFE9D6] bg-white px-4 py-2.5 text-sm font-semibold text-[#047857] shadow-sm"
                onClick={() => setGuardrailsOpen((current) => !current)}
                type="button"
              >
                <ShieldCheck className="h-4 w-4" />
                Guardrails
                <ChevronDown className={`h-4 w-4 ${guardrailsOpen ? "rotate-180" : ""}`} />
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-[#DDE5E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] shadow-sm"
                onClick={onContinue}
                type="button"
              >
                Continue workflow
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="supervisor-agent-stage" aria-hidden="true">
            <div className="supervisor-agent-orbit supervisor-agent-orbit-a" />
            <div className="supervisor-agent-orbit supervisor-agent-orbit-b" />
            <div className="supervisor-agent-core">
              <Bot className="h-10 w-10" />
              <span />
            </div>
            <div className="supervisor-agent-tag supervisor-agent-tag-a">
              <Terminal className="h-3.5 w-3.5" />
              Codex
            </div>
            <div className="supervisor-agent-tag supervisor-agent-tag-b">
              <Sparkles className="h-3.5 w-3.5" />
              Claude
            </div>
          </div>
        </div>
      </section>

      {guardrailsOpen ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SectionHeader
            title="Guardrail review"
            body="High-risk actions stay behind a human approval gate while the supervisor watches."
            action={
              restrictedMemoryCount > 0 ? (
                <Badge tone="amber">Restricted memory is being watched</Badge>
              ) : (
                <Badge tone="green">No restricted memory</Badge>
              )
            }
          />
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {guardrails.map((guardrail) => {
              const Icon = guardrail.icon;
              return (
                <article className="rounded-lg border border-[#DDE5E1] bg-[#F8FAFC] p-4" key={guardrail.title}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#047857]" />
                    <h3 className="font-semibold text-[#111827]">{guardrail.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">{guardrail.body}</p>
                  <div className="mt-3">
                    <Badge tone={guardrail.tone}>{guardrail.tone === "amber" ? "approval gate" : "monitoring"}</Badge>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#BFE9D6] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#047857]">
              Live agent monitor
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-[#111827]">Agents under supervision</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#BFE9D6] bg-[#ECFDF5] px-3 py-1.5 text-xs font-semibold text-[#047857]">
            <Radio className="h-4 w-4 animate-pulse" />
            {monitoringActive ? "streaming now" : "ready to stream"}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {agentLanes.map((agent) => {
            const Icon = agent.icon;
            return (
              <article className={`supervisor-agent-card supervisor-agent-card-${agent.id}`} key={agent.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="supervisor-agent-icon">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#111827]">{agent.name}</h3>
                      <p className="mt-1 text-sm text-[#64748B]">{agent.role}</p>
                    </div>
                  </div>
                  <Badge tone="green">{monitoringActive ? "streaming" : "watching"}</Badge>
                </div>

                <div className="mt-5 rounded-lg border border-[#DDE5E1] bg-white/80 p-4">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#047857]">
                    Active loop
                  </p>
                  <p className="mt-2 font-semibold text-[#111827]">{agent.loopName}</p>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">{agent.summary}</p>
                </div>

                <div className="mt-4 rounded-lg bg-[#0F172A] p-3 text-white">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#A7F3D0]">
                    <Activity className="h-4 w-4 animate-pulse" />
                    Real-time signal
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{agent.pulse}</p>
                </div>

                <div className="mt-4 grid gap-2">
                  {agent.signals.map((signal) => (
                    <div className="flex items-center gap-2 text-sm text-[#475569]" key={signal}>
                      <span className="h-2 w-2 rounded-full bg-[#10B981] shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                      {signal}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[0.35fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#047857]" />
              <h2 className="font-display text-lg font-bold text-[#111827]">Supervisor verdict</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#475569]">
              <p className="rounded-lg bg-[#ECFDF5] p-3">
                <Eye className="mr-2 inline h-4 w-4 text-[#047857]" />
                Loop activity is observable through saved runs, audit events, and Cognee memory status.
              </p>
              <p className="rounded-lg bg-[#FFFBEB] p-3">
                <AlertTriangle className="mr-2 inline h-4 w-4 text-[#B45309]" />
                Live external logs need agent access before every step can be streamed.
              </p>
            </div>
          </div>

          <div>
            <SectionHeader title="Recent loop activity" body="Compact feed of live signals, run notes, and audit events." />
            {activityItems.length === 0 ? (
              <EmptyState title="No activity yet" body="Activate the workflow or finish a run to populate the supervisor feed." />
            ) : (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {activityItems.map((item) => (
                  <article className="rounded-lg border border-[#E6ECE8] p-3" key={item.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-[#64748B]" />
                        <h3 className="line-clamp-1 font-semibold text-[#111827]">{item.title}</h3>
                      </div>
                      <Badge tone={item.type === "live" ? "green" : item.type === "run" ? "teal" : "slate"}>
                        {item.meta}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#64748B]">{item.body}</p>
                    <p className="mt-2 text-[11px] font-medium text-[#94A3B8]">{formatTime(item.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
