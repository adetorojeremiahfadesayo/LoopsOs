import { useState } from "react";
import { Database, Plus } from "lucide-react";
import type { AccessVisibility, AppState, MemorySourceType, Workspace } from "../domain/types";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";

const sourceTypes: MemorySourceType[] = [
  "project-docs",
  "team-rules",
  "prompt-examples",
  "run-notes",
  "security-policy",
  "research-notes"
];

export function MemoryLibrary({
  state,
  workspace,
  onCreate,
  onIngest
}: {
  state: AppState;
  workspace: Workspace;
  onCreate: (input: { title: string; type: MemorySourceType; body: string; visibility: AccessVisibility }) => void;
  onIngest: (sourceId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MemorySourceType>("project-docs");
  const [visibility, setVisibility] = useState<AccessVisibility>("workspace");
  const [body, setBody] = useState("");
  const memorySources = state.memorySources.filter((source) => source.workspaceId === workspace.id);

  function submitForm(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) {
      return;
    }
    onCreate({ title: title.trim(), type, body: body.trim(), visibility });
    setTitle("");
    setBody("");
    setVisibility("workspace");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader title="Add Memory Source" body="Paste Markdown or notes and make them recallable through Cognee." />
        <form className="space-y-4" onSubmit={submitForm}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Title</span>
            <input
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Security Rules"
              value={title}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Type</span>
              <select
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Access</span>
              <select
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => setVisibility(event.target.value as AccessVisibility)}
                value={visibility}
              >
                <option value="workspace">Workspace</option>
                <option value="private">Private</option>
                <option value="restricted">Restricted to managers</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Markdown / notes</span>
            <textarea
              className="mt-2 min-h-44 w-full rounded-md border border-slate-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setBody(event.target.value)}
              placeholder="# Project memory&#10;Rules, examples, decisions, or run notes..."
              value={body}
            />
          </label>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
            type="submit"
          >
            <Plus className="h-4 w-4" />
            Create memory source
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <SectionHeader title="Memory Library" body="Local metadata plus Cognee ingestion status." />
        {memorySources.length === 0 ? (
          <EmptyState title="No memory yet" body="Add Markdown or notes to start giving loops durable context." />
        ) : (
          <div className="space-y-3">
            {memorySources.map((source) => (
              <article className="rounded-lg border border-slate-200 p-4" key={source.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{source.title}</h3>
                      <Badge tone={source.ingestionStatus === "ingested" ? "green" : "amber"}>{source.ingestionStatus}</Badge>
                      <Badge tone={source.access.visibility === "restricted" ? "red" : "slate"}>{source.access.visibility}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{source.body.replace(/^#+\s*/gm, "")}</p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={source.ingestionStatus === "ingested"}
                    onClick={() => onIngest(source.id)}
                    type="button"
                  >
                    <Database className="h-4 w-4" />
                    Ingest
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
