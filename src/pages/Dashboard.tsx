import type { ReactNode } from "react";
import { CogneeLifecycleStrip } from "../components/CogneeLifecycleStrip";
import type { AppState, User, Workspace } from "../domain/types";

export function Dashboard({
  state,
  workspace,
  user,
  setup
}: {
  state: AppState;
  workspace: Workspace;
  user: User;
  setup?: ReactNode;
}) {
  const workspaceMemory = state.memorySources.filter((source) => source.workspaceId === workspace.id);
  const ingested = workspaceMemory.filter((source) => source.ingestionStatus === "ingested");

  return (
    <div className="space-y-8">
      <section className="loop-card-bright rounded-2xl p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#047857]">
          LoopOS command center
        </p>
        <h2 className="font-display mt-3 max-w-3xl text-4xl font-bold tracking-tight text-[#111827]">
          Build loops that remember the work.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748B]">
          Welcome back, {user.name}. Start with the memory graph, then scroll into Cognee setup when you are ready to
          connect real recall.
        </p>
      </section>

      <CogneeLifecycleStrip current="remember" />

      <MemoryGraphStage sourceCount={ingested.length} />
      {setup ? <section id="setup">{setup}</section> : null}
    </div>
  );
}

function MemoryGraphStage({ sourceCount }: { sourceCount: number }) {
  return (
    <section className="memory-graph-stage rounded-[28px] p-5 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white">Memory graph in motion</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              LoopOS keeps the nodes stable and animates the recall signal itself: templates, docs, runs, and access
              rules converge into Cognee before the next agent run.
            </p>
          </div>
        </div>

        <div className="memory-graph-canvas">
          <svg className="memory-graph-lines" viewBox="0 0 920 420" aria-hidden="true">
            <path className="graph-line graph-line-a" d="M188 122 C312 130 366 226 455 230" />
            <path className="graph-line graph-line-b" d="M732 118 C628 136 550 184 455 230" />
            <path className="graph-line graph-line-c" d="M246 316 C332 314 386 268 455 230" />
            <path className="graph-line graph-line-d" d="M676 310 C596 296 524 262 455 230" />
            <circle className="graph-pulse pulse-a" r="5" />
            <circle className="graph-pulse pulse-b" r="5" />
            <circle className="graph-pulse pulse-c" r="5" />
            <circle className="graph-pulse pulse-d" r="5" />
          </svg>

          <div className="graph-node graph-node-loop">
            <span>Loop</span>
            <strong>Code Review</strong>
            <small>4 steps loaded</small>
          </div>
          <div className="graph-node graph-node-docs">
            <span>Docs</span>
            <strong>{sourceCount || 3} sources</strong>
            <small>Indexed for retrieval</small>
          </div>
          <div className="graph-node graph-node-runs">
            <span>Runs</span>
            <strong>3 notes saved</strong>
            <small>Lessons return to memory</small>
          </div>
          <div className="graph-node graph-node-access">
            <span>Access</span>
            <strong>developer rules</strong>
            <small>Scope before recall</small>
          </div>
          <div className="graph-node graph-node-cognee">
            <span>Cognee</span>
            <strong>Recall engine</strong>
            <small>Context before every run</small>
          </div>
        </div>
      </div>
    </section>
  );
}
