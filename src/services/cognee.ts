import type { LoopPlaybook, MemorySource, RunRecord } from "../domain/types";

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
}

export interface CogneeStatus {
  baseUrl?: string;
  configured: boolean;
  message: string;
  mode: CogneeMode;
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
      headers: { "Content-Type": "application/json" },
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
  runs: RunRecord[]
): Promise<LoopImprovementResult> {
  const previousRun = runs.find((run) => run.loopId === loop.id);
  const suggestions = [
    recalledSources.sourceIds.length > 0
      ? `Bind the loop's recall step to ${recalledSources.sourceTitles.slice(0, 2).join(" and ")} before execution.`
      : "Ingest at least one memory source before relying on this loop.",
    previousRun
      ? `Use the last run note "${previousRun.outcomeNotes.slice(0, 84)}" as a reflection checkpoint.`
      : "Add an explicit reflection step so future runs can teach Cognee what changed.",
    "Keep validation checks separate from generation steps so the loop can prove it succeeded."
  ];

  return {
    recalled: recalledSources,
    generatedPlan: [
      recalledSources.summary,
      `LoopOS should run "${loop.name}" by clarifying inputs, recalling allowed Cognee memory, executing the loop steps, validating the output, and storing a short improvement note back into memory.`
    ].join(" "),
    suggestions
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
    const response = await fetch("/api/cognee/status");
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
