import { describe, expect, test } from "vitest";
import { createSeedState, MEMORY_IDS, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import {
  completeRun,
  duplicateTemplate,
  improveLoop,
  ingestMemory,
  restrictMemorySource,
  updateMemorySource
} from "./loopActions";

function lastItem<T>(items: T[]): T | undefined {
  return items[items.length - 1];
}

describe("loop actions", () => {
  test("duplicating a template creates a workspace loop and audit event", async () => {
    const state = createSeedState();
    const initialLoopCount = state.loops.length;
    const initialAuditCount = state.auditEvents.length;

    const result = await duplicateTemplate(state, {
      actorId: USER_IDS.developer,
      templateId: "template-security-review",
      workspaceId: WORKSPACE_IDS.team
    });

    const createdLoop = result.state.loops.find((loop) => loop.id === result.loopId)!;
    expect(result.state.loops).toHaveLength(initialLoopCount + 1);
    expect(createdLoop.isTemplate).toBe(false);
    expect(createdLoop.workspaceId).toBe(WORKSPACE_IDS.team);
    expect(createdLoop.name).toContain("Security Review Loop");
    expect(result.state.auditEvents).toHaveLength(initialAuditCount + 1);
    expect(lastItem(result.state.auditEvents)?.action).toBe("loop.duplicated");
  });

  test("ingesting a memory source updates status and creates an audit event", async () => {
    const state = createSeedState();
    const soloMemory = state.memorySources.find((source) => source.workspaceId === WORKSPACE_IDS.solo)!;

    const result = await ingestMemory(state, {
      actorId: USER_IDS.solo,
      sourceId: soloMemory.id
    });

    const updated = result.state.memorySources.find((source) => source.id === soloMemory.id)!;
    expect(updated.ingestionStatus).toBe("ingested");
    expect(updated.cogneeMemoryId).toBe(`cognee-${soloMemory.id}`);
    expect(result.message).toContain("Cognee indexed");
    expect(lastItem(result.state.auditEvents)?.action).toBe("memory.ingested");
  });

  test("restricting a memory source changes access policy and creates an audit event", async () => {
    const state = createSeedState();

    const result = await restrictMemorySource(state, {
      actorId: USER_IDS.manager,
      sourceId: MEMORY_IDS.codingStandards,
      allowedUserIds: [USER_IDS.manager]
    });

    const updated = result.state.memorySources.find((source) => source.id === MEMORY_IDS.codingStandards)!;
    expect(updated.access.visibility).toBe("restricted");
    expect(updated.access.allowedUserIds).toEqual([USER_IDS.manager]);
    expect(lastItem(result.state.auditEvents)?.action).toBe("memory.access_changed");
  });

  test("editing a memory source resets ingestion and creates an audit event", async () => {
    const state = createSeedState();

    const result = await updateMemorySource(state, {
      actorId: USER_IDS.developer,
      sourceId: MEMORY_IDS.codingStandards,
      patch: {
        title: "Updated Coding Standards",
        body: "# Updated Coding Standards\nPrefer focused tests before UI work."
      }
    });

    const updated = result.state.memorySources.find((source) => source.id === MEMORY_IDS.codingStandards)!;
    expect(updated.title).toBe("Updated Coding Standards");
    expect(updated.body).toContain("focused tests");
    expect(updated.ingestionStatus).toBe("draft");
    expect(updated.cogneeMemoryId).toBeUndefined();
    expect(lastItem(result.state.auditEvents)?.action).toBe("memory.edited");
  });

  test("viewers cannot edit memory sources", async () => {
    const state = createSeedState();

    await expect(
      updateMemorySource(state, {
        actorId: USER_IDS.viewer,
        sourceId: MEMORY_IDS.projectOverview,
        patch: { body: "Viewer edit" }
      })
    ).rejects.toThrow("You do not have access to edit this memory source.");
  });

  test("improving a loop uses only memory visible to the current user", async () => {
    const state = createSeedState();
    const loop = state.loops.find((item) => item.workspaceId === WORKSPACE_IDS.team && !item.isTemplate)!;

    const result = await improveLoop(state, {
      actorId: USER_IDS.viewer,
      loopId: loop.id
    });

    expect(result.improvement.recalled.sourceTitles).toContain("Project Overview");
    expect(result.improvement.recalled.sourceTitles).toContain("Coding Standards");
    expect(result.improvement.recalled.sourceTitles).not.toContain("Security Rules");
    expect(result.improvement.generatedPlan).toContain("Cognee recalled");
    expect(lastItem(result.state.auditEvents)?.action).toBe("loop.improved");
  });

  test("completing a run stores run notes and appends an audit event", async () => {
    const state = createSeedState();
    const loop = state.loops.find((item) => item.workspaceId === WORKSPACE_IDS.team && !item.isTemplate)!;

    const result = await completeRun(state, {
      actorId: USER_IDS.developer,
      loopId: loop.id,
      generatedPlan: "Run the security loop with recalled Cognee context.",
      retrievedMemorySourceIds: [MEMORY_IDS.projectOverview],
      outcomeNotes: "The review found a missing owner check.",
      improvementSuggestions: ["Add owner-check validation to future runs."]
    });

    expect(result.state.runs).toHaveLength(state.runs.length + 1);
    expect(lastItem(result.state.runs)?.outcomeNotes).toContain("missing owner check");
    expect(result.message).toContain("Cognee stored run notes");
    expect(lastItem(result.state.auditEvents)?.action).toBe("run.completed");
  });
});
