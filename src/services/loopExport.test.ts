import { describe, expect, test } from "vitest";
import { createSeedState, LOOP_IDS } from "../domain/seed";
import { createAgentHandoff, createLoopExport } from "./loopExport";

function selectedLoop() {
  const state = createSeedState();
  return state.loops.find((loop) => loop.id === LOOP_IDS.securityReview)!;
}

describe("loop export", () => {
  test("exports a loop as structured Markdown", () => {
    const output = createLoopExport(selectedLoop(), "markdown");

    expect(output.filename).toBe("guild-security-review-loop.md");
    expect(output.mimeType).toBe("text/markdown;charset=utf-8");
    expect(output.content).toContain("# Guild Security Review Loop");
    expect(output.content).toContain("## Steps\n1. Classify the change");
    expect(output.content).toContain("## Memory Rules\n- Recall security policy and coding standards");
  });

  test("exports a deterministic JSON payload", () => {
    const output = createLoopExport(selectedLoop(), "json");
    const parsed = JSON.parse(output.content);

    expect(output.filename).toBe("guild-security-review-loop.json");
    expect(parsed).toMatchObject({
      id: LOOP_IDS.securityReview,
      name: "Guild Security Review Loop",
      outputFormat: "Severity-ranked review with evidence, affected files, and fixes.",
      steps: expect.arrayContaining(["Classify the change"])
    });
    expect(parsed.exportedAt).toBeUndefined();
  });

  test("exports a reusable prompt template", () => {
    const output = createLoopExport(selectedLoop(), "prompt");

    expect(output.filename).toBe("guild-security-review-loop.prompt.md");
    expect(output.content).toContain("You are running the Guild Security Review Loop.");
    expect(output.content).toContain("Use memory according to these rules:");
    expect(output.content).toContain("Respond using this format:");
  });

  test("creates a full Codex handoff with generated files and memory", () => {
    const state = createSeedState();
    const loop = selectedLoop();
    const memorySources = state.memorySources.filter((source) => source.workspaceId === loop.workspaceId);
    const runs = state.runs.filter((run) => run.loopId === loop.id);
    const handoff = createAgentHandoff(loop, "codex", memorySources, runs, "Cognee recalled security context.");

    expect(handoff.filename).toBe("guild-security-review-loop.codex.handoff.md");
    expect(handoff.command).toBe("codex exec --file guild-security-review-loop.codex.handoff.md");
    expect(handoff.content).toContain("Target agent: Codex");
    expect(handoff.content).toContain("## Generated Markdown Files");
    expect(handoff.content).toContain("## loop/LOOP.md");
    expect(handoff.content).toContain("## Visible Cognee Memory");
    expect(handoff.content).toContain(memorySources[0].title);
    expect(handoff.content).toContain("## Latest Cognee Recall");
    expect(handoff.content).toContain("Cognee recalled security context.");
    expect(handoff.summary).toContain(`${loop.loopFiles.length} files`);
  });

  test("creates a Claude Code handoff command", () => {
    const handoff = createAgentHandoff(selectedLoop(), "claude");

    expect(handoff.command).toBe('claude -p "$(cat guild-security-review-loop.claude.handoff.md)"');
    expect(handoff.content).toContain("Target agent: Claude Code");
  });
});
