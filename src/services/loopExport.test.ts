import { describe, expect, test } from "vitest";
import { createSeedState, LOOP_IDS } from "../domain/seed";
import { createLoopExport } from "./loopExport";

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
});
