import { Trash2 } from "lucide-react";
import { Badge } from "../components/Badge";
import { CogneeLifecycleStrip } from "../components/CogneeLifecycleStrip";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import type { AppState, Workspace } from "../domain/types";

export function ForgetPage({
  state,
  workspace,
  onForget
}: {
  state: AppState;
  workspace: Workspace;
  onForget: (sourceId: string) => void;
}) {
  const sources = state.memorySources.filter((source) => source.workspaceId === workspace.id);
  const recallable = sources.filter((source) => source.ingestionStatus === "ingested");
  const forgotten = sources.filter((source) => source.ingestionStatus === "forgotten");

  return (
    <div className="space-y-7">
      <section className="loop-card-bright rounded-2xl p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Final step</p>
            <h2 className="font-display mt-3 max-w-3xl text-4xl font-bold tracking-tight text-[#111827]">
              Forget anything the loop should not carry forward.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
              Review stored context at the end of the workflow and remove stale, wrong, or sensitive memory from Cognee.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[360px]">
            <div className="rounded-xl border border-[#BFE9D6] bg-white p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#047857]">Recallable</p>
              <p className="mt-2 font-display text-3xl font-bold text-[#111827]">{recallable.length}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-white p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">Forgotten</p>
              <p className="mt-2 font-display text-3xl font-bold text-[#111827]">{forgotten.length}</p>
            </div>
          </div>
        </div>
      </section>

      <CogneeLifecycleStrip current="forget" completed={["remember", "recall", "improve"]} />

      <section className="rounded-2xl border border-[#DDE5E1] bg-white p-6 shadow-sm">
        <SectionHeader title="Recallable Sources" body="Each source below can affect future recall until you forget it." />
        {sources.length === 0 ? (
          <EmptyState title="Nothing stored yet" body="Remember loop files or run notes first, then return here to remove stale memory." />
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {sources.map((source) => (
              <article className="rounded-2xl border border-[#E6ECE8] bg-[#FBFDFB] p-5" key={source.id}>
                <div className="flex min-h-full flex-col gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold text-[#111827]">{source.title}</h3>
                      <Badge
                        tone={
                          source.ingestionStatus === "ingested"
                            ? "green"
                            : source.ingestionStatus === "forgotten"
                              ? "red"
                              : "amber"
                        }
                      >
                        {source.ingestionStatus}
                      </Badge>
                      <Badge tone={source.access.visibility === "restricted" ? "red" : "slate"}>
                        {source.access.visibility}
                      </Badge>
                    </div>
                    <p className="mt-3 line-clamp-4 text-sm leading-7 text-[#64748B]">
                      {source.body.replace(/^#+\s*/gm, "")}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <button
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-700 bg-rose-600 px-4 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-white shadow-sm transition hover:bg-rose-700 disabled:border-rose-200 disabled:bg-rose-100 disabled:text-rose-300 disabled:shadow-none"
                      disabled={source.ingestionStatus !== "ingested"}
                      onClick={() => onForget(source.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Forget
                    </button>
                  </div>
                  <p className="text-xs leading-5 text-[#64748B]">
                    {source.ingestionStatus === "ingested"
                      ? "Forget removes this source from future Cognee recall."
                      : "This source is not currently recallable."}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
