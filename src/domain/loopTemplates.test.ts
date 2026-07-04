import { describe, expect, test } from "vitest";
import { createLoopPlaybookTemplates, LOOP_TEMPLATE_FILE_NAMES, loopTemplateDefinitions } from "./loopTemplates";

describe("loop template definitions", () => {
  test("ships the five MVP industry templates", () => {
    expect(loopTemplateDefinitions.map((template) => template.name)).toEqual([
      "Web Builder & Maintainer",
      "Research Agent",
      "Code Review Agent",
      "Customer Support Agent",
      "Docs Maintainer"
    ]);
  });

  test("generates the required markdown file tree for every template", () => {
    const playbooks = createLoopPlaybookTemplates({
      ownerId: "user-owner",
      updatedAt: "2026-07-03T10:00:00.000Z"
    });

    for (const playbook of playbooks) {
      expect(playbook.loopFiles.map((file) => file.name)).toEqual(LOOP_TEMPLATE_FILE_NAMES);
      expect(playbook.loopFiles.map((file) => file.path)).toEqual([
        "loop/LOOP.md",
        "model/MODEL.md",
        "soul/SOUL.md",
        "memory/MEMORY.md",
        "tools/TOOLS.md",
        "evals/EVALS.md",
        "runbook/RUNBOOK.md",
        "handoff/HANDOFF.md"
      ]);

      for (const file of playbook.loopFiles) {
        expect(file.body).toContain(`# ${file.name}`);
        expect(file.body.length).toBeGreaterThan(700);
        expect(file.body).not.toMatch(/TBD|TODO|placeholder/i);
      }
    }
  });
});
