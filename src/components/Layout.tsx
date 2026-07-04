import {
  Activity,
  BookOpen,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  PlugZap,
  RefreshCcw,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { AppState, User, Workspace } from "../domain/types";
import type { CogneeConnection } from "../services/cogneeConnection";
import { Badge } from "./Badge";

export type PageId =
  | "setup"
  | "supervisor"
  | "dashboard"
  | "builder"
  | "export"
  | "forget"
  | "handoff"
  | "workspace"
  | "templates"
  | "docs"
  | "team"
  | "runs"
  | "demo";

const navItems: Array<{ id: PageId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "setup", label: "Setup", icon: PlugZap },
  { id: "templates", label: "Templates", icon: BookOpen },
  { id: "workspace", label: "Workspace", icon: FolderOpen },
  { id: "builder", label: "Loop Builder", icon: GitBranch },
  { id: "handoff", label: "Agent Handoff", icon: Send },
  { id: "supervisor", label: "Supervisor", icon: ShieldCheck },
  { id: "forget", label: "Forget", icon: Trash2 }
];

export function Layout({
  state,
  workspace,
  user,
  cogneeConnection,
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
  cogneeConnection: CogneeConnection | null;
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  onWorkspaceChange: (workspaceId: string) => void;
  onUserChange: (userId: string) => void;
  onReset: () => void;
  children: React.ReactNode;
}) {
  const role = workspace.memberRoles[user.id];
  const workspaceOptions = state.workspaces.filter((item) => item.kind === "solo");
  const workspaceUsers = state.users.filter((item) => workspace.memberRoles[item.id]);

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[#E6ECE8] bg-white lg:block">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b border-[#E6ECE8] px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10B981] text-white shadow-sm">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold tracking-tight">LoopOS</p>
                  <p className="text-[11px] font-medium text-[#64748B]">memory loop workbench</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active ? "bg-[#E7F8EF] text-[#047857]" : "text-[#64748B] hover:bg-[#F3F7F5] hover:text-[#111827]"
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

            <div className="border-t border-[#E6ECE8] p-3">
              <div className="rounded-lg bg-[#F6F8F7] px-3 py-3">
                <div className="flex items-center gap-2 text-[#047857]">
                  <ShieldCheck className="h-4 w-4" />
                  <p className="text-sm font-semibold">Governed recall</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-[#64748B]">
                  {cogneeConnection
                    ? `${
                        cogneeConnection.kind === "hosted-demo"
                          ? "LoopOS hosted demo"
                          : cogneeConnection.kind === "cloud"
                            ? "Cloud"
                            : "Local"
                      } Cognee is selected for durable loop memory.`
                    : "Choose hosted demo, local, or cloud Cognee before building memory-backed loops."}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#E6ECE8] bg-white/95 px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 lg:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#10B981] text-white">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-bold leading-none">LoopOS</p>
                    <p className="mt-1 text-xs text-[#64748B]">memory loop workbench</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                      Workspace
                    </p>
                    <h1 className="font-display truncate text-xl font-bold tracking-tight">{workspace.name}</h1>
                  </div>
                  <Badge tone="green">solo MVP</Badge>
                  {cogneeConnection ? (
                    <Badge tone="teal">
                      {cogneeConnection.kind === "hosted-demo"
                        ? "LoopOS demo"
                        : cogneeConnection.kind === "cloud"
                          ? "Cognee Cloud"
                          : "Local Cognee"}
                    </Badge>
                  ) : (
                    <Badge tone="amber">setup needed</Badge>
                  )}
                  {role ? <Badge tone={role === "viewer" ? "slate" : "green"}>{role}</Badge> : null}
                </div>
                <p className="mt-1 max-w-2xl truncate text-sm text-[#64748B]">{workspace.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm font-medium text-[#111827] shadow-sm"
                  onChange={(event) => onWorkspaceChange(event.target.value)}
                  value={workspace.id}
                >
                  {workspaceOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm font-medium text-[#111827] shadow-sm"
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
                  className="inline-flex items-center gap-2 rounded-lg border border-[#DDE5E1] bg-white px-3 py-2 text-sm font-semibold text-[#64748B] shadow-sm hover:border-[#10B981]/40 hover:text-[#047857]"
                  onClick={onReset}
                  type="button"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto border-t border-[#EEF2EF] pt-3 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;
                return (
                  <button
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                      active ? "bg-[#E7F8EF] text-[#047857]" : "bg-[#F6F8F7] text-[#64748B]"
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

          <main className="memory-grid flex-1 px-4 py-6 md:px-6 xl:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
