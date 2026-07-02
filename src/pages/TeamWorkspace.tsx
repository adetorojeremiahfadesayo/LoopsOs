import { LockKeyhole, ShieldCheck } from "lucide-react";
import type { AppState, User, Workspace } from "../domain/types";
import { Badge } from "../components/Badge";
import { SectionHeader } from "../components/SectionHeader";
import { canManageWorkspace } from "../services/permissions";

export function TeamWorkspace({
  state,
  workspace,
  user,
  onRestrictToManagers,
  onAllowDeveloper
}: {
  state: AppState;
  workspace: Workspace;
  user: User;
  onRestrictToManagers: (sourceId: string) => void;
  onAllowDeveloper: (sourceId: string) => void;
}) {
  const members = state.users.filter((item) => workspace.memberRoles[item.id]);
  const sharedLoops = state.loops.filter((loop) => loop.workspaceId === workspace.id && !loop.isTemplate);
  const memorySources = state.memorySources.filter((source) => source.workspaceId === workspace.id);
  const auditEvents = state.auditEvents.filter((event) => event.workspaceId === workspace.id).slice().reverse();
  const canManage = canManageWorkspace(state, workspace.id, user.id);
  const developer = state.users.find((item) => item.name.includes("Devon"));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <SectionHeader title="Team Workspace" body="Shared loops, governed docs, member roles, and traceability." />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold">{members.length}</p>
              <p className="mt-1 text-sm text-slate-500">members</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold">{sharedLoops.length}</p>
              <p className="mt-1 text-sm text-slate-500">shared loops</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold">{memorySources.length}</p>
              <p className="mt-1 text-sm text-slate-500">team docs</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
          <div className="flex items-center gap-2 text-teal-800">
            <ShieldCheck className="h-4 w-4" />
            <p className="font-semibold">Permission-aware memory</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-teal-900/80">
            Managers can restrict sensitive docs. Recall only includes sources the active user can view.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Members" />
          <div className="space-y-3">
            {members.map((member) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4" key={member.id}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                    {member.avatarInitials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.title}</p>
                  </div>
                </div>
                <Badge tone={workspace.memberRoles[member.id] === "viewer" ? "slate" : "green"}>
                  {workspace.memberRoles[member.id]}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Shared Memory Access" body="Change access and watch the audit log update." />
          <div className="space-y-3">
            {memorySources.map((source) => (
              <article className="rounded-lg border border-slate-200 p-4" key={source.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{source.title}</h3>
                      <Badge tone={source.access.visibility === "restricted" ? "red" : "green"}>{source.access.visibility}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Allowed users:{" "}
                      {source.access.allowedUserIds.length
                        ? source.access.allowedUserIds
                            .map((id) => state.users.find((item) => item.id === id)?.name ?? id)
                            .join(", ")
                        : "All workspace members"}
                    </p>
                  </div>
                  {canManage ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700"
                        onClick={() => onRestrictToManagers(source.id)}
                        type="button"
                      >
                        <LockKeyhole className="h-4 w-4" />
                        Managers only
                      </button>
                      {developer ? (
                        <button
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                          onClick={() => onAllowDeveloper(source.id)}
                          type="button"
                        >
                          Allow Devon
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader title="Audit Log" body="Every shared change is recorded for review." />
        <div className="grid gap-3 lg:grid-cols-2">
          {auditEvents.map((event) => {
            const actor = state.users.find((item) => item.id === event.actorId);
            return (
              <article className="rounded-lg border border-slate-200 p-4" key={event.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge tone="slate">{event.action.replace(".", " ")}</Badge>
                  <span className="text-xs text-slate-400">{new Date(event.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 font-semibold text-slate-950">{event.targetName}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{event.afterSummary || event.beforeSummary}</p>
                <p className="mt-2 text-xs font-medium text-slate-400">by {actor?.name ?? "Unknown user"}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
