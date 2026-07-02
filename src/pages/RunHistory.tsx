import type { AppState, Workspace } from "../domain/types";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";

export function RunHistory({ state, workspace }: { state: AppState; workspace: Workspace }) {
  const runs = state.runs.filter((run) => run.workspaceId === workspace.id).slice().reverse();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeader title="Run History" body="Saved generated plans, recalled memory, run notes, and improvement ideas." />
      {runs.length === 0 ? (
        <EmptyState title="No runs yet" body="Run a loop and save notes to teach Cognee what worked." />
      ) : (
        <div className="space-y-4">
          {runs.map((run) => {
            const loop = state.loops.find((item) => item.id === run.loopId);
            const actor = state.users.find((item) => item.id === run.actorId);
            const memory = run.retrievedMemorySourceIds
              .map((id) => state.memorySources.find((source) => source.id === id)?.title)
              .filter(Boolean);
            return (
              <article className="rounded-lg border border-slate-200 p-5" key={run.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{loop?.name ?? "Unknown loop"}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(run.createdAt).toLocaleString()} by {actor?.name ?? "Unknown user"}
                    </p>
                  </div>
                  <Badge tone="teal">{memory.length} recalled</Badge>
                </div>
                <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">{run.generatedPlan}</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Outcome notes</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{run.outcomeNotes}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Improvements</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                      {run.improvementSuggestions.map((suggestion) => (
                        <li key={suggestion}>- {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {memory.map((title) => (
                    <Badge key={title} tone="slate">
                      {title}
                    </Badge>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
