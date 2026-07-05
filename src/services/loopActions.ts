import type {
  AccessPolicy,
  AppState,
  LoopFile,
  LoopPlaybook,
  MemorySource,
  MemorySourceType,
  RunRecord
} from "../domain/types";
import { createAuditEvent } from "./audit";
import {
  forgetMemorySource,
  ingestMemorySource,
  recallForLoop,
  rememberLoopFile,
  storeRunNotes,
  suggestLoopImprovements,
  type LoopImprovementResult
} from "./cognee";
import { canEditLoop, canEditMemorySource, canManageWorkspace, canViewMemorySource } from "./permissions";

function now() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function findLoop(state: AppState, loopId: string): LoopPlaybook {
  const loop = state.loops.find((item) => item.id === loopId);
  if (!loop) {
    throw new Error(`Loop not found: ${loopId}`);
  }
  return loop;
}

function findMemorySource(state: AppState, sourceId: string): MemorySource {
  const source = state.memorySources.find((item) => item.id === sourceId);
  if (!source) {
    throw new Error(`Memory source not found: ${sourceId}`);
  }
  return source;
}

export async function duplicateTemplate(
  state: AppState,
  input: { templateId: string; workspaceId: string; actorId: string }
): Promise<{ state: AppState; loopId: string }> {
  const template = state.loops.find((loop) => loop.id === input.templateId && loop.isTemplate);
  if (!template) {
    throw new Error(`Template not found: ${input.templateId}`);
  }

  const timestamp = now();
  const loop: LoopPlaybook = {
    ...template,
    id: createId("loop"),
    workspaceId: input.workspaceId,
    ownerId: input.actorId,
    name: `${template.name} Copy`,
    isTemplate: false,
    version: 1,
    updatedAt: timestamp,
    access: { visibility: "workspace", allowedUserIds: [] }
  };

  const audit = createAuditEvent({
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    action: "loop.duplicated",
    targetType: "loop",
    targetId: loop.id,
    targetName: loop.name,
    afterSummary: `Duplicated from template "${template.name}".`
  });

  return {
    loopId: loop.id,
    state: {
      ...state,
      loops: [...state.loops, loop],
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function createMemorySource(
  state: AppState,
  input: {
    workspaceId: string;
    actorId: string;
    title: string;
    type: MemorySourceType;
    body: string;
    access: AccessPolicy;
  }
): Promise<{ state: AppState; sourceId: string }> {
  const source: MemorySource = {
    id: createId("memory"),
    workspaceId: input.workspaceId,
    ownerId: input.actorId,
    title: input.title,
    type: input.type,
    body: input.body,
    access: input.access,
    ingestionStatus: "draft",
    createdAt: now(),
    updatedAt: now()
  };

  const audit = createAuditEvent({
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    action: "memory.created",
    targetType: "memory",
    targetId: source.id,
    targetName: source.title,
    afterSummary: `Created ${source.type.replace("-", " ")} memory source.`
  });

  return {
    sourceId: source.id,
    state: {
      ...state,
      memorySources: [...state.memorySources, source],
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function ingestMemory(
  state: AppState,
  input: { sourceId: string; actorId: string }
): Promise<{ state: AppState; message: string }> {
  const source = findMemorySource(state, input.sourceId);
  if (!canViewMemorySource(state, source, input.actorId)) {
    throw new Error("You do not have access to ingest this memory source.");
  }

  const result = await ingestMemorySource(source);
  const updatedSource: MemorySource = {
    ...source,
    ingestionStatus: "ingested",
    cogneeMemoryId: result.cogneeMemoryId,
    updatedAt: now()
  };

  const audit = createAuditEvent({
    workspaceId: source.workspaceId,
    actorId: input.actorId,
    action: "memory.ingested",
    targetType: "memory",
    targetId: source.id,
    targetName: source.title,
    afterSummary: result.message
  });

  return {
    message: result.message,
    state: {
      ...state,
      memorySources: state.memorySources.map((item) => (item.id === source.id ? updatedSource : item)),
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function restrictMemorySource(
  state: AppState,
  input: { sourceId: string; actorId: string; allowedUserIds: string[] }
): Promise<{ state: AppState }> {
  const source = findMemorySource(state, input.sourceId);
  if (!canManageWorkspace(state, source.workspaceId, input.actorId)) {
    throw new Error("Only owners and managers can restrict memory sources.");
  }

  const updatedSource: MemorySource = {
    ...source,
    access: {
      visibility: "restricted",
      allowedUserIds: input.allowedUserIds
    },
    updatedAt: now()
  };

  const audit = createAuditEvent({
    workspaceId: source.workspaceId,
    actorId: input.actorId,
    action: "memory.access_changed",
    targetType: "memory",
    targetId: source.id,
    targetName: source.title,
    beforeSummary: source.access.visibility,
    afterSummary: `Restricted to ${input.allowedUserIds.length} user${input.allowedUserIds.length === 1 ? "" : "s"}.`
  });

  return {
    state: {
      ...state,
      memorySources: state.memorySources.map((item) => (item.id === source.id ? updatedSource : item)),
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function forgetMemory(
  state: AppState,
  input: { sourceId: string; actorId: string }
): Promise<{ state: AppState; message: string }> {
  const source = findMemorySource(state, input.sourceId);
  if (!canEditMemorySource(state, source, input.actorId)) {
    throw new Error("You do not have access to forget this memory source.");
  }

  const result = await forgetMemorySource(source);
  const updatedSource: MemorySource = {
    ...source,
    ingestionStatus: "forgotten",
    cogneeMemoryId: undefined,
    updatedAt: now()
  };

  const audit = createAuditEvent({
    workspaceId: source.workspaceId,
    actorId: input.actorId,
    action: "memory.forgotten",
    targetType: "memory",
    targetId: source.id,
    targetName: source.title,
    afterSummary: result.message
  });

  return {
    message: result.message,
    state: {
      ...state,
      memorySources: state.memorySources.map((item) => (item.id === source.id ? updatedSource : item)),
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function updateMemorySource(
  state: AppState,
  input: {
    sourceId: string;
    actorId: string;
    patch: Partial<Pick<MemorySource, "title" | "type" | "body" | "access">>;
  }
): Promise<{ state: AppState }> {
  const source = findMemorySource(state, input.sourceId);
  if (!canEditMemorySource(state, source, input.actorId)) {
    throw new Error("You do not have access to edit this memory source.");
  }

  const bodyChanged = input.patch.body !== undefined && input.patch.body !== source.body;
  const titleChanged = input.patch.title !== undefined && input.patch.title !== source.title;
  const typeChanged = input.patch.type !== undefined && input.patch.type !== source.type;
  const accessChanged =
    input.patch.access !== undefined &&
    (input.patch.access.visibility !== source.access.visibility ||
      input.patch.access.allowedUserIds.join("|") !== source.access.allowedUserIds.join("|"));

  const updatedSource: MemorySource = {
    ...source,
    ...input.patch,
    ingestionStatus: bodyChanged ? "draft" : source.ingestionStatus,
    cogneeMemoryId: bodyChanged ? undefined : source.cogneeMemoryId,
    updatedAt: now()
  };

  const changedFields = [
    titleChanged ? "title" : null,
    typeChanged ? "type" : null,
    bodyChanged ? "body" : null,
    accessChanged ? "access" : null
  ].filter(Boolean);

  const audit = createAuditEvent({
    workspaceId: source.workspaceId,
    actorId: input.actorId,
    action: "memory.edited",
    targetType: "memory",
    targetId: source.id,
    targetName: updatedSource.title,
    beforeSummary: source.title,
    afterSummary: `Updated ${changedFields.length > 0 ? changedFields.join(", ") : "metadata"}.`
  });

  return {
    state: {
      ...state,
      memorySources: state.memorySources.map((item) => (item.id === source.id ? updatedSource : item)),
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function updateLoop(
  state: AppState,
  input: { loopId: string; actorId: string; patch: Partial<Omit<LoopPlaybook, "id" | "workspaceId" | "isTemplate">> }
): Promise<{ state: AppState }> {
  const loop = findLoop(state, input.loopId);
  if (!canEditLoop(state, loop, input.actorId)) {
    throw new Error("You do not have access to edit this loop.");
  }

  const updatedLoop: LoopPlaybook = {
    ...loop,
    ...input.patch,
    version: loop.version + 1,
    updatedAt: now()
  };

  const audit = createAuditEvent({
    workspaceId: loop.workspaceId!,
    actorId: input.actorId,
    action: "loop.edited",
    targetType: "loop",
    targetId: loop.id,
    targetName: updatedLoop.name,
    beforeSummary: `Version ${loop.version}`,
    afterSummary: `Version ${updatedLoop.version}`
  });

  return {
    state: {
      ...state,
      loops: state.loops.map((item) => (item.id === loop.id ? updatedLoop : item)),
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

function filePath(folder: string, name: string) {
  const safeFolder = folder.trim().replace(/^\/+|\/+$/g, "") || "loop";
  const safeName = name.trim() || "UNTITLED.md";
  return `${safeFolder}/${safeName}`;
}

export async function updateLoopFile(
  state: AppState,
  input: {
    loopId: string;
    actorId: string;
    fileId: string;
    body?: string;
    folder?: string;
    name?: string;
  }
): Promise<{ state: AppState; message: string }> {
  const loop = findLoop(state, input.loopId);
  if (!canEditLoop(state, loop, input.actorId)) {
    throw new Error("You do not have access to edit this loop.");
  }

  const file = loop.loopFiles.find((item) => item.id === input.fileId);
  if (!file) {
    throw new Error(`Loop file not found: ${input.fileId}`);
  }

  let updatedFile: LoopFile = {
    ...file,
    body: input.body ?? file.body,
    folder: input.folder ?? file.folder,
    name: input.name ?? file.name,
    updatedAt: now()
  };
  updatedFile.path = filePath(updatedFile.folder, updatedFile.name);

  const memoryResult = await rememberLoopFile(loop, updatedFile);
  updatedFile = {
    ...updatedFile,
    cogneeMemoryId: memoryResult.cogneeMemoryId,
    rememberedAt: now()
  };

  const updatedLoop: LoopPlaybook = {
    ...loop,
    loopFiles: loop.loopFiles.map((item) => (item.id === file.id ? updatedFile : item)),
    updatedAt: now(),
    version: loop.version + 1
  };

  const audit = createAuditEvent({
    workspaceId: loop.workspaceId!,
    actorId: input.actorId,
    action: "loop.edited",
    targetType: "loop",
    targetId: loop.id,
    targetName: loop.name,
    beforeSummary: file.path,
    afterSummary: `Updated ${updatedFile.path}.`
  });

  return {
    message: memoryResult.message,
    state: {
      ...state,
      loops: state.loops.map((item) => (item.id === loop.id ? updatedLoop : item)),
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function createLoopFile(
  state: AppState,
  input: {
    loopId: string;
    actorId: string;
    folder: string;
    name: string;
    body: string;
  }
): Promise<{ state: AppState; fileId: string; message: string }> {
  const loop = findLoop(state, input.loopId);
  if (!canEditLoop(state, loop, input.actorId)) {
    throw new Error("You do not have access to edit this loop.");
  }

  const timestamp = now();
  let file: LoopFile = {
    id: createId("file"),
    name: input.name.trim() || "UNTITLED.md",
    folder: input.folder.trim() || "loop",
    path: "",
    body: input.body,
    updatedAt: timestamp
  };
  file.path = filePath(file.folder, file.name);

  const memoryResult = await rememberLoopFile(loop, file);
  file = {
    ...file,
    cogneeMemoryId: memoryResult.cogneeMemoryId,
    rememberedAt: now()
  };

  const updatedLoop: LoopPlaybook = {
    ...loop,
    loopFiles: [...loop.loopFiles, file],
    updatedAt: timestamp,
    version: loop.version + 1
  };

  const audit = createAuditEvent({
    workspaceId: loop.workspaceId!,
    actorId: input.actorId,
    action: "loop.edited",
    targetType: "loop",
    targetId: loop.id,
    targetName: loop.name,
    afterSummary: `Created ${file.path}.`
  });

  return {
    fileId: file.id,
    message: memoryResult.message,
    state: {
      ...state,
      loops: state.loops.map((item) => (item.id === loop.id ? updatedLoop : item)),
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function improveLoop(
  state: AppState,
  input: { loopId: string; actorId: string; improvementPrompt?: string }
): Promise<{ state: AppState; improvement: LoopImprovementResult }> {
  const loop = findLoop(state, input.loopId);
  if (!loop.workspaceId) {
    throw new Error("Templates must be duplicated before they can be improved.");
  }

  const allowedSources = state.memorySources.filter(
    (source) => source.workspaceId === loop.workspaceId && canViewMemorySource(state, source, input.actorId)
  );
  const recalled = await recallForLoop(loop, allowedSources);
  const improvement = await suggestLoopImprovements(
    loop,
    recalled,
    state.runs.filter((run) => run.loopId === loop.id),
    input.improvementPrompt
  );

  const audit = createAuditEvent({
    workspaceId: loop.workspaceId,
    actorId: input.actorId,
    action: "loop.improved",
    targetType: "loop",
    targetId: loop.id,
    targetName: loop.name,
    afterSummary: `Cognee recalled ${recalled.sourceIds.length} allowed memory source${recalled.sourceIds.length === 1 ? "" : "s"}.`
  });

  return {
    improvement,
    state: {
      ...state,
      auditEvents: [...state.auditEvents, audit]
    }
  };
}

export async function completeRun(
  state: AppState,
  input: {
    loopId: string;
    actorId: string;
    retrievedMemorySourceIds: string[];
    generatedPlan: string;
    outcomeNotes: string;
    improvementSuggestions: string[];
  }
): Promise<{ state: AppState; message: string; runId: string }> {
  const loop = findLoop(state, input.loopId);
  if (!loop.workspaceId) {
    throw new Error("Templates cannot be completed as runs.");
  }

  const run: RunRecord = {
    id: createId("run"),
    workspaceId: loop.workspaceId,
    loopId: loop.id,
    actorId: input.actorId,
    retrievedMemorySourceIds: input.retrievedMemorySourceIds,
    generatedPlan: input.generatedPlan,
    outcomeNotes: input.outcomeNotes,
    improvementSuggestions: input.improvementSuggestions,
    createdAt: now()
  };

  const result = await storeRunNotes(run);
  const audit = createAuditEvent({
    workspaceId: loop.workspaceId,
    actorId: input.actorId,
    action: "run.completed",
    targetType: "run",
    targetId: run.id,
    targetName: loop.name,
    afterSummary: result.message
  });

  return {
    runId: run.id,
    message: result.message,
    state: {
      ...state,
      runs: [...state.runs, run],
      auditEvents: [...state.auditEvents, audit]
    }
  };
}
