import { useEffect, useMemo, useState } from "react";
import { resetAppState, loadAppState, saveAppState } from "./services/storage";

export default function App() {
  const [state, setState] = useState(loadAppState);
  const workspace = useMemo(
    () => state.workspaces.find((item) => item.id === state.selectedWorkspaceId) ?? state.workspaces[0],
    [state.selectedWorkspaceId, state.workspaces]
  );
  const user = useMemo(
    () => state.users.find((item) => item.id === state.selectedUserId) ?? state.users[0],
    [state.selectedUserId, state.users]
  );

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
      <section className="mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Cognee memory workbench</p>
          <button
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
            onClick={() => setState(resetAppState())}
            type="button"
          >
            Reset demo
          </button>
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">LoopOS</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          A memory-powered loop engineering platform for solo developers and AI teams.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workspace</p>
            <p className="mt-2 text-lg font-semibold">{workspace.name}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">User</p>
            <p className="mt-2 text-lg font-semibold">{user.name}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Loops</p>
            <p className="mt-2 text-lg font-semibold">{state.loops.filter((loop) => !loop.isTemplate).length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Memory sources</p>
            <p className="mt-2 text-lg font-semibold">{state.memorySources.length}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
