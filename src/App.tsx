import { useEffect, useMemo, useState } from "react";
import { Layout, type PageId } from "./components/Layout";
import type { AccessVisibility, LoopPlaybook, MemorySourceType } from "./domain/types";
import { Dashboard } from "./pages/Dashboard";
import { DemoMode } from "./pages/DemoMode";
import { LoopBuilder } from "./pages/LoopBuilder";
import { MemoryLibrary } from "./pages/MemoryLibrary";
import { RunHistory } from "./pages/RunHistory";
import { TeamWorkspace } from "./pages/TeamWorkspace";
import { Templates } from "./pages/Templates";
import { getCogneeStatus, type CogneeStatus, type LoopImprovementResult } from "./services/cognee";
import {
  completeRun,
  createMemorySource,
  duplicateTemplate,
  improveLoop,
  ingestMemory,
  restrictMemorySource,
  updateLoop
} from "./services/loopActions";
import { resetAppState, loadAppState, saveAppState } from "./services/storage";

const fallbackCogneeStatus: CogneeStatus = {
  configured: false,
  message: "Cognee bridge is unavailable, so LoopOS is using the demo fallback.",
  mode: "demo-fallback",
  ok: false
};

export default function App() {
  const [state, setState] = useState(loadAppState);
  const [activePage, setActivePage] = useState<PageId>("dashboard");
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);
  const [lastImprovement, setLastImprovement] = useState<LoopImprovementResult | null>(null);
  const [cogneeStatus, setCogneeStatus] = useState<CogneeStatus>(fallbackCogneeStatus);
  const [toast, setToast] = useState<string | null>(null);

  const workspace = useMemo(
    () => state.workspaces.find((item) => item.id === state.selectedWorkspaceId) ?? state.workspaces[0],
    [state.selectedWorkspaceId, state.workspaces]
  );
  const workspaceUserIds = useMemo(() => Object.keys(workspace.memberRoles), [workspace.memberRoles]);
  const user = useMemo(() => {
    const selected = state.users.find((item) => item.id === state.selectedUserId);
    if (selected && workspace.memberRoles[selected.id]) {
      return selected;
    }
    return state.users.find((item) => item.id === workspaceUserIds[0]) ?? state.users[0];
  }, [state.selectedUserId, state.users, workspace.memberRoles, workspaceUserIds]);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    let active = true;

    void getCogneeStatus().then((status) => {
      if (active) {
        setCogneeStatus(status);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  function handleReset() {
    setState(resetAppState());
    setActivePage("dashboard");
    setSelectedLoopId(null);
    setLastImprovement(null);
    showToast("Demo state reset.");
  }

  function handleWorkspaceChange(workspaceId: string) {
    const nextWorkspace = state.workspaces.find((item) => item.id === workspaceId);
    const firstMemberId = nextWorkspace ? Object.keys(nextWorkspace.memberRoles)[0] : state.selectedUserId;
    setState((current) => ({
      ...current,
      selectedWorkspaceId: workspaceId,
      selectedUserId: firstMemberId
    }));
    setSelectedLoopId(null);
    setLastImprovement(null);
  }

  function handleUserChange(userId: string) {
    setState((current) => ({ ...current, selectedUserId: userId }));
    setLastImprovement(null);
  }

  async function handleDuplicate(templateId: string) {
    try {
      const result = await duplicateTemplate(state, {
        templateId,
        workspaceId: workspace.id,
        actorId: user.id
      });
      setState(result.state);
      setSelectedLoopId(result.loopId);
      setLastImprovement(null);
      setActivePage("builder");
      showToast("Template duplicated into this workspace.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not duplicate template.");
    }
  }

  async function handleCreateMemory(input: {
    title: string;
    type: MemorySourceType;
    body: string;
    visibility: AccessVisibility;
  }) {
    try {
      const allowedUserIds =
        input.visibility === "private"
          ? [user.id]
          : input.visibility === "restricted"
            ? Object.entries(workspace.memberRoles)
                .filter(([, role]) => role === "owner" || role === "manager")
                .map(([id]) => id)
            : [];

      const result = await createMemorySource(state, {
        workspaceId: workspace.id,
        actorId: user.id,
        title: input.title,
        type: input.type,
        body: input.body,
        access: {
          visibility: input.visibility,
          allowedUserIds
        }
      });
      setState(result.state);
      showToast("Memory source created.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not create memory source.");
    }
  }

  async function handleIngest(sourceId: string) {
    try {
      const result = await ingestMemory(state, { sourceId, actorId: user.id });
      setState(result.state);
      showToast(result.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not ingest memory.");
    }
  }

  async function handleRestrictToManagers(sourceId: string) {
    try {
      const managerIds = Object.entries(workspace.memberRoles)
        .filter(([, role]) => role === "owner" || role === "manager")
        .map(([id]) => id);
      const result = await restrictMemorySource(state, {
        sourceId,
        actorId: user.id,
        allowedUserIds: managerIds
      });
      setState(result.state);
      showToast("Memory source restricted to managers.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not restrict memory source.");
    }
  }

  async function handleAllowDeveloper(sourceId: string) {
    try {
      const managerIds = Object.entries(workspace.memberRoles)
        .filter(([, role]) => role === "owner" || role === "manager")
        .map(([id]) => id);
      const developer = state.users.find((item) => item.name.includes("Devon"));
      const result = await restrictMemorySource(state, {
        sourceId,
        actorId: user.id,
        allowedUserIds: developer ? Array.from(new Set([...managerIds, developer.id])) : managerIds
      });
      setState(result.state);
      showToast("Developer access updated.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not update access.");
    }
  }

  async function handleSaveLoop(loopId: string, patch: Partial<LoopPlaybook>) {
    try {
      const result = await updateLoop(state, {
        loopId,
        actorId: user.id,
        patch
      });
      setState(result.state);
      showToast("Loop saved and audit event recorded.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save loop.");
    }
  }

  async function handleImprove(loopId: string) {
    try {
      const result = await improveLoop(state, { loopId, actorId: user.id });
      setState(result.state);
      setLastImprovement(result.improvement);
      showToast("Cognee recalled visible memory and improved the loop.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not improve loop.");
    }
  }

  async function handleCompleteRun(input: {
    loopId: string;
    generatedPlan: string;
    retrievedMemorySourceIds: string[];
    outcomeNotes: string;
    improvementSuggestions: string[];
  }) {
    try {
      const result = await completeRun(state, {
        actorId: user.id,
        ...input
      });
      setState(result.state);
      setActivePage("runs");
      showToast(result.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save run.");
    }
  }

  const page = (() => {
    switch (activePage) {
      case "templates":
        return <Templates state={state} workspace={workspace} onDuplicate={handleDuplicate} />;
      case "memory":
        return (
          <MemoryLibrary
            state={state}
            workspace={workspace}
            onCreate={handleCreateMemory}
            onIngest={handleIngest}
          />
        );
      case "team":
        return (
          <TeamWorkspace
            state={state}
            user={user}
            workspace={workspace}
            onAllowDeveloper={handleAllowDeveloper}
            onRestrictToManagers={handleRestrictToManagers}
          />
        );
      case "builder":
        return (
          <LoopBuilder
            state={state}
            user={user}
            workspace={workspace}
            selectedLoopId={selectedLoopId}
            lastImprovement={lastImprovement}
            onCompleteRun={handleCompleteRun}
            onImproveLoop={handleImprove}
            onSaveLoop={handleSaveLoop}
            onSelectLoop={setSelectedLoopId}
          />
        );
      case "runs":
        return <RunHistory state={state} workspace={workspace} />;
      case "demo":
        return <DemoMode cogneeStatus={cogneeStatus} state={state} />;
      case "dashboard":
      default:
        return <Dashboard cogneeStatus={cogneeStatus} state={state} user={user} workspace={workspace} />;
    }
  })();

  return (
    <>
      <Layout
        activePage={activePage}
        state={state}
        user={user}
        workspace={workspace}
        onPageChange={setActivePage}
        onReset={handleReset}
        onUserChange={handleUserChange}
        onWorkspaceChange={handleWorkspaceChange}
      >
        {page}
      </Layout>
      {toast ? (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg">
          {toast}
        </div>
      ) : null}
    </>
  );
}
