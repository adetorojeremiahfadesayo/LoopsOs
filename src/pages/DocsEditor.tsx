import { useEffect, useMemo, useState } from "react";
import { Database, FileText, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import type { AppState, MemorySource, MemorySourceType, User, Workspace } from "../domain/types";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import { canEditMemorySource, canManageWorkspace, canViewMemorySource } from "../services/permissions";

const sourceTypes: MemorySourceType[] = [
  "project-docs",
  "team-rules",
  "prompt-examples",
  "run-notes",
  "security-policy",
  "research-notes"
];

type EditableDocPatch = Pick<MemorySource, "title" | "type" | "body">;

function stripMarkdown(value: string) {
  return value.replace(/^#+\s*/gm, "").trim();
}

function accessSummary(state: AppState, source: MemorySource) {
  if (source.access.visibility === "workspace") {
    return "All workspace members";
  }

  if (source.access.visibility === "private") {
    const owner = state.users.find((item) => item.id === source.ownerId);
    return owner ? `Private to ${owner.name}` : "Private";
  }

  return source.access.allowedUserIds
    .map((id) => state.users.find((item) => item.id === id)?.name ?? id)
    .join(", ");
}

export function DocsEditor({
  state,
  workspace,
  user,
  onSave,
  onIngest,
  onRestrictToManagers
}: {
  state: AppState;
  workspace: Workspace;
  user: User;
  onSave: (sourceId: string, patch: EditableDocPatch) => void;
  onIngest: (sourceId: string) => void;
  onRestrictToManagers: (sourceId: string) => void;
}) {
  const visibleSources = useMemo(
    () =>
      state.memorySources.filter(
        (source) => source.workspaceId === workspace.id && canViewMemorySource(state, source, user.id)
      ),
    [state, user.id, workspace.id]
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(visibleSources[0]?.id ?? null);
  const selectedSource = visibleSources.find((source) => source.id === selectedSourceId) ?? visibleSources[0] ?? null;
  const canEdit = selectedSource ? canEditMemorySource(state, selectedSource, user.id) : false;
  const canManage = canManageWorkspace(state, workspace.id, user.id);
  const [title, setTitle] = useState(selectedSource?.title ?? "");
  const [type, setType] = useState<MemorySourceType>(selectedSource?.type ?? "project-docs");
  const [body, setBody] = useState(selectedSource?.body ?? "");

  useEffect(() => {
    if (!selectedSource && visibleSources[0]) {
      setSelectedSourceId(visibleSources[0].id);
      return;
    }

    if (selectedSourceId && !visibleSources.some((source) => source.id === selectedSourceId)) {
      setSelectedSourceId(visibleSources[0]?.id ?? null);
    }
  }, [selectedSource, selectedSourceId, visibleSources]);

  useEffect(() => {
    setTitle(selectedSource?.title ?? "");
    setType(selectedSource?.type ?? "project-docs");
    setBody(selectedSource?.body ?? "");
  }, [selectedSource?.id, selectedSource?.body, selectedSource?.title, selectedSource?.type]);

  const isDirty =
    Boolean(selectedSource) &&
    (title !== selectedSource?.title || type !== selectedSource?.type || body !== selectedSource?.body);

  function saveDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSource || !canEdit || !title.trim() || !body.trim()) {
      return;
    }

    onSave(selectedSource.id, {
      body: body.trim(),
      title: title.trim(),
      type
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <SectionHeader title="Docs" body="Edit shared Markdown memory with role-aware access and audit history." />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold">{visibleSources.length}</p>
              <p className="mt-1 text-sm text-slate-500">visible docs</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold">
                {visibleSources.filter((source) => source.ingestionStatus === "ingested").length}
              </p>
              <p className="mt-1 text-sm text-slate-500">indexed in Cognee</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-2xl font-semibold">
                {state.auditEvents.filter((event) => event.workspaceId === workspace.id && event.action === "memory.edited").length}
              </p>
              <p className="mt-1 text-sm text-slate-500">recorded edits</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
          <div className="flex items-center gap-2 text-teal-800">
            <ShieldCheck className="h-4 w-4" />
            <p className="font-semibold">Governed document memory</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-teal-900/80">
            Editors can update shared docs. Viewers only see documents allowed by the access policy.
          </p>
        </div>
      </section>

      {visibleSources.length === 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <EmptyState title="No visible docs" body="Ask a workspace manager to share a memory document with you." />
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader title="Document Library" body="Select a memory document to review or edit." />
            <div className="space-y-3">
              {visibleSources.map((source) => {
                const active = source.id === selectedSource?.id;
                return (
                  <button
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      active
                        ? "border-slate-950 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50"
                    }`}
                    key={source.id}
                    onClick={() => setSelectedSourceId(source.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-500" />
                      <span className="font-semibold text-slate-950">{source.title}</span>
                      <Badge tone={source.ingestionStatus === "ingested" ? "green" : "amber"}>
                        {source.ingestionStatus}
                      </Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{stripMarkdown(source.body)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone={source.access.visibility === "restricted" ? "red" : "slate"}>
                        {source.access.visibility}
                      </Badge>
                      <Badge tone="slate">{source.type}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={saveDocument}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionHeader
                title={selectedSource?.title ?? "Document"}
                body={selectedSource ? accessSummary(state, selectedSource) : undefined}
              />
              <Badge tone={canEdit ? "green" : "slate"}>{canEdit ? "Editable" : "Read only"}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_0.55fr]">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Document title</span>
                <input
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={!canEdit}
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Type</span>
                <select
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-500"
                  disabled={!canEdit}
                  onChange={(event) => setType(event.target.value as MemorySourceType)}
                  value={type}
                >
                  {sourceTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Markdown body</span>
              <textarea
                className="mt-2 min-h-96 w-full resize-y rounded-md border border-slate-200 px-3 py-2 font-mono text-sm leading-6 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:text-slate-500"
                disabled={!canEdit}
                onChange={(event) => setBody(event.target.value)}
                value={body}
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone={selectedSource?.access.visibility === "restricted" ? "red" : "slate"}>
                  {selectedSource?.access.visibility ?? "workspace"}
                </Badge>
                <Badge tone={isDirty ? "amber" : "green"}>{isDirty ? "unsaved" : "synced"}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSource && canManage ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:text-rose-700"
                    onClick={() => onRestrictToManagers(selectedSource.id)}
                    type="button"
                  >
                    <LockKeyhole className="h-4 w-4" />
                    Managers only
                  </button>
                ) : null}
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!selectedSource || !canEdit || selectedSource.ingestionStatus === "ingested"}
                  onClick={() => selectedSource && onIngest(selectedSource.id)}
                  type="button"
                >
                  <Database className="h-4 w-4" />
                  Ingest
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={!selectedSource || !canEdit || !isDirty || !title.trim() || !body.trim()}
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  Save document
                </button>
              </div>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
