import { BookOpen, Database, History, ListChecks } from "lucide-react";
import type { AppState, User, Workspace } from "../domain/types";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";

export function Dashboard({ state, workspace, user }: { state: AppState; workspace: Workspace; user: User }) {
  const workspaceLoops = state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate);
  const workspaceMemory = state.memorySources.filter((source) => source.workspaceId === workspace.id);
  const workspaceRuns = state.runs.filter((run) => run.workspaceId === workspace.id);
  const workspaceAudit = state.auditEvents.filter((event) => event.workspaceId === workspace.id);
  const ingested = workspaceMemory.filter((source) => source.ingestionStatus === "ingested");

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail="Reusable workflows" icon={BookOpen} label="Loops" value={workspaceLoops.length} />
        <StatCard detail={`${ingested.length} indexed by Cognee`} icon={Database} label="Memory" value={workspaceMemory.length} />
        <StatCard detail="Saved execution records" icon={History} label="Runs" value={workspaceRuns.length} />
        <StatCard detail="Traceable team changes" icon={ListChecks} label="Audit events" value={workspaceAudit.length} />
      </section>

      <section className="rounded-lg border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Cognee Memory Signal</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {ingested.length} governed source{ingested.length === 1 ? "" : "s"} ready to recall
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {user.name} can run loops with workspace memory filtered through role and document access rules. Restricted
              security context stays available only to approved members.
            </p>
          </div>
          <Badge tone="teal">Cognee-backed</Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {ingested.slice(0, 3).map((source) => (
            <div className="rounded-lg border border-white/80 bg-white/80 p-4 shadow-sm" key={source.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">{source.title}</p>
                <Badge tone={source.access.visibility === "restricted" ? "red" : "green"}>{source.access.visibility}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{source.body.replace(/^#+\s*/gm, "")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Recent Loops" body="Team-approved playbooks and solo workflows ready to run." />
          <div className="space-y-3">
            {workspaceLoops.map((loop) => (
              <div className="rounded-lg border border-slate-200 p-4" key={loop.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{loop.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{loop.summary}</p>
                  </div>
                  <Badge tone="amber">v{loop.version}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {loop.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Activity" body="The latest governed changes in this workspace." />
          <div className="space-y-3">
            {workspaceAudit.slice(-5).reverse().map((event) => {
              const actor = state.users.find((item) => item.id === event.actorId);
              return (
                <div className="rounded-lg border border-slate-200 p-4" key={event.id}>
                  <div className="flex items-center justify-between gap-3">
                    <Badge tone="slate">{event.action.replace(".", " ")}</Badge>
                    <span className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{event.targetName}</p>
                  <p className="mt-1 text-sm text-slate-500">{event.afterSummary || event.beforeSummary}</p>
                  <p className="mt-2 text-xs font-medium text-slate-400">by {actor?.name ?? "Unknown user"}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
