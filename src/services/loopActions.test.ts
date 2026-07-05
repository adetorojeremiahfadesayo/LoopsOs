import { describe, expect, test } from "vitest";
import { createSeedState, MEMORY_IDS, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import {
  completeRun,
  duplicateTemplate,
  forgetMemory,
  improveLoop,
  ingestMemory,
  restrictMemorySource,
  createLoopFile,
  updateLoopFile,
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
      templateId: "template-code-review-agent",
      workspaceId: WORKSPACE_IDS.team
    });

    const createdLoop = result.state.loops.find((loop) => loop.id === result.loopId)!;
    expect(result.state.loops).toHaveLength(initialLoopCount + 1);
    expect(createdLoop.isTemplate).toBe(false);
    expect(createdLoop.workspaceId).toBe(WORKSPACE_IDS.team);
    expect(createdLoop.name).toContain("Code Review Agent");
    expect(createdLoop.loopFiles.map((file) => file.name)).toContain("LOOP.md");
    expect(createdLoop.loopFiles.find((file) => file.name === "HANDOFF.md")?.body).toContain("Codex");
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

  test("forgetting a memory source removes it from recallable Cognee memory", async () => {
    const state = createSeedState();

    const result = await forgetMemory(state, {
      actorId: USER_IDS.developer,
      sourceId: MEMORY_IDS.codingStandards
    });

    const updated = result.state.memorySources.find((source) => source.id === MEMORY_IDS.codingStandards)!;
    expect(updated.ingestionStatus).toBe("forgotten");
    expect(updated.cogneeMemoryId).toBeUndefined();
    expect(result.message).toContain("forgot");
    expect(lastItem(result.state.auditEvents)?.action).toBe("memory.forgotten");
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

  test("editing a loop file updates the file body and creates an audit event", async () => {
    const state = createSeedState();
    const loop = state.loops.find((item) => item.isTemplate && item.id === "template-web-builder-maintainer")!;

    const duplicated = await duplicateTemplate(state, {
      actorId: USER_IDS.solo,
      templateId: loop.id,
      workspaceId: WORKSPACE_IDS.solo
    });
    const created = duplicated.state.loops.find((item) => item.id === duplicated.loopId)!;
    const file = created.loopFiles.find((item) => item.name === "MEMORY.md")!;

    const result = await updateLoopFile(duplicated.state, {
      actorId: USER_IDS.solo,
      body: "# MEMORY.md\n\nRemember the user's preferred frontend stack.",
      fileId: file.id,
      loopId: created.id
    });

    const updatedLoop = result.state.loops.find((item) => item.id === created.id)!;
    const updatedFile = updatedLoop.loopFiles.find((item) => item.id === file.id)!;
    expect(updatedFile.body).toContain("preferred frontend stack");
    expect(updatedFile.cogneeMemoryId).toContain(file.id);
    expect(updatedFile.rememberedAt).toBeDefined();
    expect(result.message).toContain("remembered");
    expect(updatedLoop.version).toBe(created.version + 1);
    expect(lastItem(result.state.auditEvents)?.action).toBe("loop.edited");
  });

  test("creating a loop file appends an editable markdown file", async () => {
    const state = createSeedState();
    const duplicated = await duplicateTemplate(state, {
      actorId: USER_IDS.solo,
      templateId: "template-web-builder-maintainer",
      workspaceId: WORKSPACE_IDS.solo
    });

    const result = await createLoopFile(duplicated.state, {
      actorId: USER_IDS.solo,
      body: "# NOTES.md\n\nScratch context for the next run.",
      folder: "notes",
      loopId: duplicated.loopId,
      name: "NOTES.md"
    });

    const updatedLoop = result.state.loops.find((item) => item.id === duplicated.loopId)!;
    const createdFile = updatedLoop.loopFiles.find((file) => file.path === "notes/NOTES.md")!;
    expect(createdFile.cogneeMemoryId).toContain(createdFile.id);
    expect(result.fileId).toMatch(/^file-/);
    expect(result.message).toContain("remembered");
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

  test("improving a loop includes the user improvement request in the report", async () => {
    const state = createSeedState();
    const loop = state.loops.find((item) => item.workspaceId === WORKSPACE_IDS.team && !item.isTemplate)!;
    const improvementPrompt =
      "Make the agent stricter about mobile responsiveness, accessibility checks, and avoiding fake UI controls before handoff.";

    const result = await improveLoop(state, {
      actorId: USER_IDS.manager,
      improvementPrompt,
      loopId: loop.id
    });

    expect(result.improvement.userRequest).toBe(improvementPrompt);
    expect(result.improvement.generatedPlan).toContain("User requested");
    expect(result.improvement.generatedPlan).toContain("mobile responsiveness");
    expect(result.improvement.suggestions).toContain(
      "Apply the user request before handoff: make the agent stricter about mobile responsiveness, accessibility checks, and avoiding fake UI controls before handoff."
    );
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
