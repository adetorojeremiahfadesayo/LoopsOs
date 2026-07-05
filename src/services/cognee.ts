import type { LoopFile, LoopPlaybook, MemorySource, RunRecord } from "../domain/types";
import { cogneeHeadersFromConnection, loadCogneeConnection } from "./cogneeConnection";

export type CogneeMode = "live" | "auth-needed" | "api-mismatch" | "demo-fallback";

export interface CogneeRecallResult {
  mode?: CogneeMode;
  sourceIds: string[];
  sourceTitles: string[];
  summary: string;
}

export interface LoopImprovementResult {
  recalled: CogneeRecallResult;
  generatedPlan: string;
  suggestions: string[];
  userRequest?: string;
}

export interface CogneeStatus {
  baseUrl?: string;
  configured: boolean;
  message: string;
  mode: CogneeMode;
  ok: boolean;
}

export interface LocalCogneeStartResult {
  baseUrl?: string;
  message: string;
  mode: "starting" | "already-running" | "docker-missing" | "config-needed" | "start-failed";
  ok: boolean;
}

interface IngestResult {
  cogneeMemoryId: string;
  datasetName?: string;
  message: string;
  mode?: CogneeMode;
}

interface StoreRunResult {
  datasetName?: string;
  message: string;
  mode?: CogneeMode;
}

interface RememberLoopFileResult {
  cogneeMemoryId: string;
  datasetName?: string;
  message: string;
  mode?: CogneeMode;
}

interface ForgetMemoryResult {
  message: string;
  mode?: CogneeMode;
}

function getSourceSignal(source: MemorySource): string {
  const firstHeading = source.body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0)
    ?.replace(/^#+\s*/, "");

  return firstHeading || source.title;
}

async function postToBridge<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...cogneeHeadersFromConnection(loadCogneeConnection())
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function fallbackIngest(source: MemorySource): IngestResult {
  return {
    cogneeMemoryId: `cognee-${source.id}`,
    message: `Cognee indexed "${source.title}" via Demo fallback as durable ${source.type.replace("-", " ")} memory.`,
    mode: "demo-fallback"
  };
}

export async function ingestMemorySource(source: MemorySource): Promise<IngestResult> {
  const live = await postToBridge<Omit<IngestResult, "message">>("/api/cognee/ingest", { source });
  if (live?.cogneeMemoryId) {
    return {
      ...live,
      message: `Cognee indexed "${source.title}" into ${live.datasetName ?? "the configured dataset"}.`,
      mode: live.mode ?? "live"
    };
  }

  return fallbackIngest(source);
}

export async function rememberLoopFile(loop: LoopPlaybook, file: LoopFile): Promise<RememberLoopFileResult> {
  const live = await postToBridge<Omit<RememberLoopFileResult, "message">>("/api/cognee/remember-loop-file", {
    file,
    loop
  });
  if (live?.cogneeMemoryId) {
    return {
      ...live,
      message: `Cognee remembered "${file.path}" in ${live.datasetName ?? "the configured dataset"}.`,
      mode: live.mode ?? "live"
    };
  }

  return fallbackRememberLoopFile(loop, file);
}

export async function forgetMemorySource(source: MemorySource): Promise<ForgetMemoryResult> {
  const live = await postToBridge<ForgetMemoryResult>("/api/cognee/forget", { source });
  if (live?.message) {
    return {
      ...live,
      mode: live.mode ?? "live"
    };
  }

  return {
    message: `Cognee forgot "${source.title}" via Demo fallback. It will no longer be recalled until re-ingested.`,
    mode: "demo-fallback"
  };
}

function fallbackRecallForLoop(loop: LoopPlaybook, allowedSources: MemorySource[]): CogneeRecallResult {
  const rankedSources = allowedSources
    .filter((source) => source.ingestionStatus === "ingested")
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title));

  const sourceTitles = rankedSources.map((source) => source.title);
  const signals = rankedSources.map(getSourceSignal);

  return {
    mode: "demo-fallback",
    sourceIds: rankedSources.map((source) => source.id),
    sourceTitles,
    summary:
      rankedSources.length > 0
        ? `Cognee recalled ${rankedSources.length} source${rankedSources.length === 1 ? "" : "s"} for "${loop.name}": ${signals.join("; ")}.`
        : `Cognee found no ingested memory visible to this user for "${loop.name}".`
  };
}

export async function recallForLoop(loop: LoopPlaybook, allowedSources: MemorySource[]): Promise<CogneeRecallResult> {
  const live = await postToBridge<CogneeRecallResult>("/api/cognee/recall", { loop, allowedSources });
  if (live?.summary) {
    return {
      ...live,
      mode: live.mode ?? "live"
    };
  }

  return fallbackRecallForLoop(loop, allowedSources);
}

export async function suggestLoopImprovements(
  loop: LoopPlaybook,
  recalledSources: CogneeRecallResult,
  runs: RunRecord[],
  userRequest = ""
): Promise<LoopImprovementResult> {
  const previousRun = runs.find((run) => run.loopId === loop.id);
  const cleanUserRequest = userRequest.trim();
  const suggestions = [
    cleanUserRequest
      ? `Apply the user request before handoff: ${cleanUserRequest.charAt(0).toLowerCase()}${cleanUserRequest.slice(1)}`
      : null,
    recalledSources.sourceIds.length > 0
      ? `Bind the loop's recall step to ${recalledSources.sourceTitles.slice(0, 2).join(" and ")} before execution.`
      : "Ingest at least one memory source before relying on this loop.",
    previousRun
      ? `Use the last run note "${previousRun.outcomeNotes.slice(0, 84)}" as a reflection checkpoint.`
      : "Add an explicit reflection step so future runs can teach Cognee what changed.",
    "Keep validation checks separate from generation steps so the loop can prove it succeeded."
  ].filter((suggestion): suggestion is string => Boolean(suggestion));

  return {
    recalled: recalledSources,
    generatedPlan: [
      recalledSources.summary,
      cleanUserRequest ? `User requested: ${cleanUserRequest}` : "",
      `LoopOS should run "${loop.name}" by clarifying inputs, recalling allowed Cognee memory, executing the loop steps, validating the output, and storing a short improvement note back into memory.`
    ]
      .filter(Boolean)
      .join(" "),
    suggestions,
    userRequest: cleanUserRequest || undefined
  };
}

export async function storeRunNotes(run: RunRecord): Promise<StoreRunResult> {
  const live = await postToBridge<StoreRunResult>("/api/cognee/store-run", { run });
  if (live?.message) {
    return {
      ...live,
      mode: live.mode ?? "live"
    };
  }

  return {
    message: `Cognee stored run notes via Demo fallback for future recall: ${run.outcomeNotes.slice(0, 120)}`,
    mode: "demo-fallback"
  };
}

export async function getCogneeStatus(): Promise<CogneeStatus> {
  try {
    const response = await fetch("/api/cognee/status", {
      headers: cogneeHeadersFromConnection(loadCogneeConnection())
    });
    if (response.ok) {
      return (await response.json()) as CogneeStatus;
    }
  } catch {
    // Fall through to the deterministic local mode.
  }

  return {
    configured: false,
    message: "Cognee bridge is unavailable, so LoopOS is using the demo fallback.",
    mode: "demo-fallback",
    ok: false
  };
}

function fallbackRememberLoopFile(loop: LoopPlaybook, file: LoopFile): RememberLoopFileResult {
  return {
    cogneeMemoryId: `cognee-${loop.id}-${file.id}`,
    message: `Cognee remembered "${file.path}" via Demo fallback as loop file context.`,
    mode: "demo-fallback"
  };
}

export async function startLocalCognee(): Promise<LocalCogneeStartResult> {
  try {
    const response = await fetch("/api/cognee/local/start", {
      method: "POST"
    });

    if (response.ok) {
      return (await response.json()) as LocalCogneeStartResult;
    }
  } catch {
    // Fall through to a stable message for the UI.
  }

  return {
    message: "LoopOS could not reach the local API bridge to start Cognee.",
    mode: "start-failed",
    ok: false
  };
}
