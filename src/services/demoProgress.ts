import type { AppState } from "../domain/types";

export type DemoProgressStepId =
  | "workspace-loop"
  | "ingested-memory"
  | "docs-edited"
  | "restricted-memory"
  | "loop-improved"
  | "run-saved";

export interface DemoProgressStep {
  id: DemoProgressStepId;
  title: string;
  body: string;
  complete: boolean;
}

export interface DemoProgress {
  completedCount: number;
  percent: number;
  steps: DemoProgressStep[];
}

export function getDemoProgress(state: AppState, workspaceId: string): DemoProgress {
  const workspaceLoops = state.loops.filter((loop) => loop.workspaceId === workspaceId && !loop.isTemplate);
  const workspaceMemory = state.memorySources.filter((source) => source.workspaceId === workspaceId);
  const workspaceRuns = state.runs.filter((run) => run.workspaceId === workspaceId);
  const workspaceAudit = state.auditEvents.filter((event) => event.workspaceId === workspaceId);

  const steps: DemoProgressStep[] = [
    {
      id: "workspace-loop",
      title: "Create a workspace loop",
      body: "Duplicate a reusable template into the team workspace.",
      complete: workspaceLoops.length > 0
    },
    {
      id: "ingested-memory",
      title: "Ingest memory",
      body: "Index at least one Markdown document into Cognee memory.",
      complete: workspaceMemory.some((source) => source.ingestionStatus === "ingested")
    },
    {
      id: "docs-edited",
      title: "Edit governed docs",
      body: "Save a document change so audit history records the update.",
      complete: workspaceAudit.some((event) => event.action === "memory.edited")
    },
    {
      id: "restricted-memory",
      title: "Prove access control",
      body: "Keep sensitive memory restricted to approved users.",
      complete: workspaceMemory.some((source) => source.access.visibility === "restricted")
    },
    {
      id: "loop-improved",
      title: "Improve with Cognee",
      body: "Run Cognee recall against allowed memory for the selected loop.",
      complete: workspaceAudit.some((event) => event.action === "loop.improved")
    },
    {
      id: "run-saved",
      title: "Save run notes",
      body: "Persist outcome notes so the next loop run has memory of what happened.",
      complete: workspaceRuns.length > 0
    }
  ];
  const completedCount = steps.filter((step) => step.complete).length;

  return {
    completedCount,
    percent: Math.round((completedCount / steps.length) * 100),
    steps
  };
}
