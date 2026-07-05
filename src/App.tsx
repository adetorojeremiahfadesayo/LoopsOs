import { useEffect, useMemo, useState } from "react";
import { Layout, type PageId } from "./components/Layout";
import type { LoopPlaybook } from "./domain/types";
import { AgentHandoffPage } from "./pages/AgentHandoffPage";
import { CogneeSetup } from "./pages/CogneeSetup";
import { Dashboard } from "./pages/Dashboard";
import { ForgetPage } from "./pages/ForgetPage";
import { LoopBuilder } from "./pages/LoopBuilder";
import { LoopExportPage } from "./pages/LoopExportPage";
import { LoopWorkspace } from "./pages/LoopWorkspace";
import { SupervisorPage } from "./pages/SupervisorPage";
import { TeamWorkspace } from "./pages/TeamWorkspace";
import { Templates } from "./pages/Templates";
import { getCogneeStatus, startLocalCognee, type CogneeStatus, type LoopImprovementResult } from "./services/cognee";
import {
  type CogneeConnection,
  defaultCogneeConnection,
  loadCogneeConnection,
  saveCogneeConnection
} from "./services/cogneeConnection";
import {
  completeRun,
  createLoopFile,
  duplicateTemplate,
  forgetMemory,
  improveLoop,
  ingestMemory,
  restrictMemorySource,
  updateLoopFile,
  updateLoop
} from "./services/loopActions";
import { resetAppState, loadAppState, saveAppState } from "./services/storage";

const fallbackCogneeStatus: CogneeStatus = {
  configured: false,
  message: "Cognee bridge is unavailable, so LoopOS is using the demo fallback.",
  mode: "demo-fallback",
  ok: false
};

function loadSoloAppState() {
  const loaded = loadAppState();
  const soloWorkspace = loaded.workspaces.find((item) => item.kind === "solo");
  if (!soloWorkspace) {
    return loaded;
  }

  return {
    ...loaded,
    selectedWorkspaceId: soloWorkspace.id,
    selectedUserId: Object.keys(soloWorkspace.memberRoles)[0] ?? loaded.selectedUserId
  };
}

export default function App() {
  const [state, setState] = useState(loadSoloAppState);
  const [connection, setConnection] = useState<CogneeConnection | null>(loadCogneeConnection);
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
    window.scrollTo({ left: 0, top: 0 });
  }, [activePage]);

  function refreshCogneeStatus() {
    let active = true;

    void getCogneeStatus().then((status) => {
      if (active) {
        setCogneeStatus(status);
      }
    });

    return () => {
      active = false;
    };
  }

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
  }, [connection]);

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

  function handleSaveConnection(nextConnection: CogneeConnection) {
    saveCogneeConnection(nextConnection);
    setConnection(nextConnection);
    setActivePage("templates");
    showToast("Cognee memory selected. Choose a loop template next.");
  }

  async function handleStartLocalCognee() {
    const localConnection = defaultCogneeConnection("local");
    saveCogneeConnection(localConnection);
    setConnection(localConnection);
    setActivePage("templates");

    const result = await startLocalCognee();
    showToast(result.message);

    if (result.ok) {
      const runningLocalConnection = {
        ...defaultCogneeConnection("local"),
        baseUrl: result.baseUrl ?? "http://127.0.0.1:8000"
      };
      saveCogneeConnection(runningLocalConnection);
      setConnection(runningLocalConnection);
      void getCogneeStatus().then(setCogneeStatus);
    }
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
      setActivePage("workspace");
      showToast("Template duplicated into this workspace.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not duplicate template.");
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

  async function handleForgetMemory(sourceId: string) {
    try {
      const result = await forgetMemory(state, { sourceId, actorId: user.id });
      setState(result.state);
      showToast(result.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not forget memory source.");
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

  async function handleSaveLoopFile(
    loopId: string,
    input: { fileId: string; folder: string; name: string; body: string }
  ) {
    try {
      const result = await updateLoopFile(state, {
        actorId: user.id,
        loopId,
        ...input
      });
      setState(result.state);
      showToast(result.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save loop file.");
    }
  }

  async function handleCreateLoopFile(loopId: string, input: { folder: string; name: string; body: string }) {
    try {
      const result = await createLoopFile(state, {
        actorId: user.id,
        loopId,
        ...input
      });
      setState(result.state);
      setSelectedLoopId(loopId);
      showToast(result.message);
      return result.fileId;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not create loop file.");
      return null;
    }
  }

  async function handleRunAndRecallLoop(loopId: string, patch: Partial<LoopPlaybook>, improvementPrompt: string) {
    try {
      const saved = await updateLoop(state, {
        loopId,
        actorId: user.id,
        patch
      });
      const improved = await improveLoop(saved.state, { loopId, actorId: user.id, improvementPrompt });
      setState(improved.state);
      setLastImprovement(improved.improvement);
      setActivePage("handoff");
      showToast("Loop improved. Report is ready in Agent Handoff.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not run and recall loop.");
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
      setActivePage("supervisor");
      showToast(result.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save run.");
    }
  }

  const page = (() => {
    const setupPanel = (
      <CogneeSetup
        connection={connection}
        status={cogneeStatus}
        onRefresh={refreshCogneeStatus}
        onSave={handleSaveConnection}
        onStartLocal={handleStartLocalCognee}
      />
    );
    switch (activePage) {
      case "setup":
        return setupPanel;
      case "templates":
        return <Templates state={state} workspace={workspace} onDuplicate={handleDuplicate} />;
      case "forget":
        return (
          <ForgetPage
            state={state}
            workspace={workspace}
            onForget={handleForgetMemory}
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
            onRunAndRecallLoop={handleRunAndRecallLoop}
          />
        );
      case "workspace":
        return (
          <LoopWorkspace
            state={state}
            user={user}
            workspace={workspace}
            selectedLoopId={selectedLoopId}
            onCreateFile={handleCreateLoopFile}
            onContinue={() => setActivePage("builder")}
            onSaveFile={handleSaveLoopFile}
            onSelectLoop={setSelectedLoopId}
          />
        );
      case "export":
        return (
          <LoopExportPage
            state={state}
            workspace={workspace}
            selectedLoopId={selectedLoopId}
            onSelectLoop={setSelectedLoopId}
          />
        );
      case "handoff":
        return (
          <AgentHandoffPage
            state={state}
            workspace={workspace}
            selectedLoopId={selectedLoopId}
            lastImprovement={lastImprovement}
            onCompleteRun={handleCompleteRun}
            onSelectLoop={setSelectedLoopId}
          />
        );
      case "supervisor":
        return <SupervisorPage state={state} workspace={workspace} onContinue={() => setActivePage("forget")} />;
      case "dashboard":
      default:
        return (
          <Dashboard
            state={state}
            user={user}
            workspace={workspace}
            setup={setupPanel}
          />
        );
    }
  })();

  return (
    <>
      <Layout
        activePage={activePage}
        cogneeConnection={connection}
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
