import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  ChevronDown,
  ClipboardCheck,
  Code2,
  Eye,
  GitCompareArrows,
  Play,
  Radio,
  SearchCheck,
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
import { reviewSupervisorLoop, type SupervisorAgentVerdict } from "../services/supervisorAgent";

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

function supervisorAgentText(value: string | undefined, fallback = "") {
  return (value || fallback)
    .replace(/\bQwen supervisor\b/gi, "Supervisor agent")
    .replace(/\bQwen\b/gi, "Supervisor agent")
    .replace(/\bqwen-plus\b/gi, "live model");
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
  const [qwenVerdict, setQwenVerdict] = useState<SupervisorAgentVerdict | null>(null);

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
      name: "Claude Code",
      role: "Independent review agent",
      loopName: secondLoop?.name ?? "No active loop",
      summary:
        secondLoop && latestLoop
          ? "Monitors a separate reasoning lane and compares its findings against Codex output as logs arrive."
          : "Connect another handoff or import a log to compare two agents side by side.",
      signals: [
        "Cross-agent disagreement checks armed",
        "Loop drift warnings enabled",
        "Final approval gate visible"
      ],
      pulse: "Reviewing reasoning traces and missing context",
      icon: SearchCheck
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

  async function activateWorkflow() {
    const createdAt = new Date().toISOString();
    setMonitoringActive(true);
    setLiveEvents((current) => [
      {
        id: `live-${Date.now()}`,
        title: "Live monitor attached",
        body: "Supervisor started streaming Codex and Claude Code activity for this workflow.",
        meta: "Live signal",
        createdAt,
        type: "live"
      },
      ...current
    ]);

    const verdict = await reviewSupervisorLoop({
      auditEvents,
      latestLoop,
      memorySources,
      runs
    });

    if (verdict) {
      setQwenVerdict(verdict);
      setLiveEvents((current) => [
        {
          id: `qwen-${Date.now()}`,
          title: supervisorAgentText(verdict.verdict, "Supervisor agent active"),
          body: supervisorAgentText(verdict.summary),
          meta: `Supervisor agent ${verdict.riskLevel} risk`,
          createdAt: new Date().toISOString(),
          type: "live"
        },
        ...current
      ]);
    }
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
              Claude Code
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

      <section className="supervisor-verdict-panel">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#047857] shadow-[0_14px_34px_rgba(16,185,129,0.18)]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
            {qwenVerdict ? supervisorAgentText(qwenVerdict.verdict, "Supervisor agent active") : "Supervisor verdict"}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#475569]">
            {qwenVerdict
              ? supervisorAgentText(qwenVerdict.summary)
              :
              "The senior AI engineer view decides whether the active agent loop is observable, governed, and ready for a human approval gate."}
          </p>
          {qwenVerdict ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge tone="green">Supervisor agent live</Badge>
              <Badge tone={qwenVerdict.riskLevel === "high" ? "amber" : "teal"}>{qwenVerdict.riskLevel} risk</Badge>
              <Badge tone="slate">Live model</Badge>
            </div>
          ) : null}
        </div>

        <div className="mx-auto mt-6 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="supervisor-verdict-card supervisor-verdict-card-safe">
            <Eye className="h-5 w-5" />
            <div>
              <h3>{qwenVerdict ? "Supervisor next action" : "Observable loop"}</h3>
              <p>
                {qwenVerdict
                  ? supervisorAgentText(qwenVerdict.nextAction)
                  :
                  "Loop activity is visible through saved runs, audit events, and Cognee memory status."}
              </p>
            </div>
          </article>
          <article className="supervisor-verdict-card supervisor-verdict-card-warning">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3>{qwenVerdict ? "Supervisor guardrails" : "Access required"}</h3>
              <p>
                {qwenVerdict?.guardrails[0]
                  ? supervisorAgentText(qwenVerdict.guardrails[0])
                  :
                  "Live external logs need agent access before every step can be streamed in real time."}
              </p>
              {qwenVerdict?.disagreements[0] ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#B45309]">
                  {supervisorAgentText(qwenVerdict.disagreements[0])}
                </p>
              ) : null}
            </div>
          </article>
        </div>
      </section>

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

                <div className="supervisor-agent-loop-box">
                  <p className="supervisor-agent-label">
                    Active loop
                  </p>
                  <p className="mt-2 font-semibold text-[#111827]">{agent.loopName}</p>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">{agent.summary}</p>
                </div>

                <div className="supervisor-agent-signal">
                  <div className="supervisor-agent-signal-label">
                    <Activity className="h-4 w-4 animate-pulse" />
                    Real-time signal
                  </div>
                  <p className="mt-2 text-sm leading-6">{agent.pulse}</p>
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

      <section className="supervisor-activity-footer">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="font-display text-sm font-bold text-[#111827]">Recent loop activity</p>
            <p className="mt-1 text-xs text-[#64748B]">Small live signal feed at the end of the supervisor page.</p>
          </div>
          <Badge tone="slate">{activityItems.length} signals</Badge>
        </div>
        {activityItems.length === 0 ? (
          <EmptyState title="No activity yet" body="Activate the workflow or finish a run to populate the supervisor feed." />
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {activityItems.slice(0, 4).map((item) => (
              <article className="supervisor-activity-item" key={item.id}>
                <div className="flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5 text-[#64748B]" />
                  <h3 className="line-clamp-1 text-xs font-semibold text-[#111827]">{item.title}</h3>
                </div>
                <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-[#64748B]">{item.body}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
                    {item.meta}
                  </span>
                  <span className="text-[10px] font-medium text-[#94A3B8]">{formatTime(item.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
