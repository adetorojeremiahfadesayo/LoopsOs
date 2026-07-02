import { afterEach, describe, expect, test, vi } from "vitest";
import type { LoopPlaybook, MemorySource, RunRecord } from "../domain/types";
import { getCogneeStatus, ingestMemorySource, recallForLoop, storeRunNotes } from "./cognee";

const source: MemorySource = {
  id: "memory-1",
  workspaceId: "workspace-1",
  ownerId: "user-1",
  title: "Project Overview",
  type: "project-docs",
  body: "# Project Overview\nLoopOS helps teams govern loop memory.",
  access: { visibility: "workspace", allowedUserIds: [] },
  ingestionStatus: "ingested",
  createdAt: "2026-07-02T10:00:00.000Z",
  updatedAt: "2026-07-02T10:00:00.000Z"
};

const loop: LoopPlaybook = {
  id: "loop-1",
  workspaceId: "workspace-1",
  ownerId: "user-1",
  name: "Planning Loop",
  summary: "Plan safely.",
  goal: "Create a realistic execution plan.",
  inputRequirements: ["Problem statement"],
  steps: ["Clarify", "Recall", "Execute"],
  memoryRules: ["Use visible project docs only."],
  validationChecks: ["Plan has owner and next step."],
  outputFormat: "Markdown",
  access: { visibility: "workspace", allowedUserIds: [] },
  tags: ["planning"],
  version: 1,
  isTemplate: false,
  updatedAt: "2026-07-02T10:00:00.000Z"
};

const run: RunRecord = {
  id: "run-1",
  workspaceId: "workspace-1",
  loopId: "loop-1",
  actorId: "user-1",
  retrievedMemorySourceIds: ["memory-1"],
  generatedPlan: "Use Cognee memory before execution.",
  outcomeNotes: "The run needs stronger validation.",
  improvementSuggestions: ["Add a validation gate."],
  createdAt: "2026-07-02T10:00:00.000Z"
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("frontend Cognee adapter", () => {
  test("uses the live backend when ingestion succeeds", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            cogneeMemoryId: "loopos_workspace_1_memory_1",
            datasetName: "loopos_workspace_1_memory_1",
            mode: "live"
          }),
          { status: 200 }
        )
    );
    vi.stubGlobal("fetch", fetchImpl);

    const result = await ingestMemorySource(source);

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/cognee/ingest",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source })
      })
    );
    expect(result.mode).toBe("live");
    expect(result.message).toContain("Cognee indexed");
    expect(result.cogneeMemoryId).toBe("loopos_workspace_1_memory_1");
  });

  test("falls back to deterministic demo ingestion when backend is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("missing", { status: 503 })));

    const result = await ingestMemorySource(source);

    expect(result.mode).toBe("demo-fallback");
    expect(result.cogneeMemoryId).toBe("cognee-memory-1");
    expect(result.message).toContain("Demo fallback");
  });

  test("uses backend recall response when available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              mode: "live",
              sourceIds: ["memory-1"],
              sourceTitles: ["Project Overview"],
              summary: "Cognee recalled the project overview."
            }),
            { status: 200 }
          )
      )
    );

    const result = await recallForLoop(loop, [source]);

    expect(result.mode).toBe("live");
    expect(result.summary).toBe("Cognee recalled the project overview.");
    expect(result.sourceIds).toEqual(["memory-1"]);
  });

  test("checks backend status and reports demo fallback when missing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("missing", { status: 404 })));

    const result = await getCogneeStatus();

    expect(result.mode).toBe("demo-fallback");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("demo fallback");
  });

  test("stores run notes through the backend when available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              mode: "live",
              message: "Cognee stored run notes in loopos_workspace_1_loop_1_runs."
            }),
            { status: 200 }
          )
      )
    );

    const result = await storeRunNotes(run);

    expect(result.mode).toBe("live");
    expect(result.message).toContain("Cognee stored run notes");
  });
});
