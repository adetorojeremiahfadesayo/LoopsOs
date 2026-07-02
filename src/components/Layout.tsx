import {
  Activity,
  BookOpen,
  Boxes,
  Database,
  GitBranch,
  History,
  LayoutDashboard,
  MonitorPlay,
  RefreshCcw,
  ShieldCheck,
  Users
} from "lucide-react";
import type { AppState, User, Workspace } from "../domain/types";
import { Badge } from "./Badge";

export type PageId = "dashboard" | "builder" | "templates" | "memory" | "team" | "runs" | "demo";

const navItems: Array<{ id: PageId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "builder", label: "Loop Builder", icon: GitBranch },
  { id: "templates", label: "Templates", icon: BookOpen },
  { id: "memory", label: "Memory", icon: Database },
  { id: "team", label: "Team", icon: Users },
  { id: "runs", label: "Runs", icon: History },
  { id: "demo", label: "Demo", icon: MonitorPlay }
];

export function Layout({
  state,
  workspace,
  user,
  activePage,
  onPageChange,
  onWorkspaceChange,
  onUserChange,
  onReset,
  children
}: {
  state: AppState;
  workspace: Workspace;
  user: User;
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  onWorkspaceChange: (workspaceId: string) => void;
  onUserChange: (userId: string) => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  const role = workspace.memberRoles[user.id];
  const workspaceUsers = state.users.filter((item) => workspace.memberRoles[item.id]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">LoopOS</p>
                  <p className="text-xs font-medium text-slate-500">Cognee memory workbench</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                <div className="flex items-center gap-2 text-teal-800">
                  <ShieldCheck className="h-4 w-4" />
                  <p className="text-sm font-semibold">Governed recall</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-teal-800/80">
                  Cognee recall is filtered through workspace roles and document access.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 lg:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">LoopOS</p>
                    <p className="mt-1 text-xs text-slate-500">Cognee memory workbench</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight">{workspace.name}</h1>
                  <Badge tone={workspace.kind === "team" ? "teal" : "amber"}>{workspace.kind}</Badge>
                  {role ? <Badge tone={role === "viewer" ? "slate" : "green"}>{role}</Badge> : null}
                </div>
                <p className="mt-1 max-w-2xl truncate text-sm text-slate-500">{workspace.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  onChange={(event) => onWorkspaceChange(event.target.value)}
                  value={workspace.id}
                >
                  {state.workspaces.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                  onChange={(event) => onUserChange(event.target.value)}
                  value={user.id}
                >
                  {workspaceUsers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
                  onClick={onReset}
                  type="button"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                      active ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6 xl:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
