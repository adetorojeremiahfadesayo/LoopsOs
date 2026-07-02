import type { LoopPlaybook, MemorySource, RunRecord } from "../domain/types";

export interface CogneeRecallResult {
  sourceIds: string[];
  sourceTitles: string[];
  summary: string;
}

export interface LoopImprovementResult {
  recalled: CogneeRecallResult;
  generatedPlan: string;
  suggestions: string[];
}

function getSourceSignal(source: MemorySource): string {
  const firstHeading = source.body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0)
    ?.replace(/^#+\s*/, "");

  return firstHeading || source.title;
}

export async function ingestMemorySource(source: MemorySource): Promise<{ cogneeMemoryId: string; message: string }> {
  return {
    cogneeMemoryId: `cognee-${source.id}`,
    message: `Cognee indexed "${source.title}" as durable ${source.type.replace("-", " ")} memory.`
  };
}

export async function recallForLoop(loop: LoopPlaybook, allowedSources: MemorySource[]): Promise<CogneeRecallResult> {
  const rankedSources = allowedSources
    .filter((source) => source.ingestionStatus === "ingested")
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title));

  const sourceTitles = rankedSources.map((source) => source.title);
  const signals = rankedSources.map(getSourceSignal);

  return {
    sourceIds: rankedSources.map((source) => source.id),
    sourceTitles,
    summary:
      rankedSources.length > 0
        ? `Cognee recalled ${rankedSources.length} source${rankedSources.length === 1 ? "" : "s"} for "${loop.name}": ${signals.join("; ")}.`
        : `Cognee found no ingested memory visible to this user for "${loop.name}".`
  };
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

export async function storeRunNotes(run: RunRecord): Promise<{ message: string }> {
  return {
    message: `Cognee stored run notes for future recall: ${run.outcomeNotes.slice(0, 120)}`
  };
}
