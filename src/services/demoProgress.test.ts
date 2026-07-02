import { describe, expect, test } from "vitest";
import { createSeedState, LOOP_IDS, MEMORY_IDS, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import type { AuditEvent } from "../domain/types";
import { getDemoProgress } from "./demoProgress";

function audit(action: AuditEvent["action"], targetId: string): AuditEvent {
  return {
    id: `audit-${action}-${targetId}`,
    workspaceId: WORKSPACE_IDS.team,
    actorId: USER_IDS.manager,
    action,
    targetType: action.startsWith("loop") ? "loop" : "memory",
    targetId,
    targetName: targetId,
    createdAt: "2026-07-02T12:00:00.000Z"
  };
}

describe("demo progress", () => {
  test("derives completed demo milestones from app state", () => {
    const state = createSeedState();
    const progress = getDemoProgress(state, WORKSPACE_IDS.team);

    expect(progress.completedCount).toBe(4);
    expect(progress.steps.find((step) => step.id === "workspace-loop")?.complete).toBe(true);
    expect(progress.steps.find((step) => step.id === "docs-edited")?.complete).toBe(false);
    expect(progress.steps.find((step) => step.id === "loop-improved")?.complete).toBe(false);
  });

  test("marks doc editing and loop improvement after matching audit events exist", () => {
    const state = createSeedState();
    const progress = getDemoProgress(
      {
        ...state,
        auditEvents: [
          ...state.auditEvents,
          audit("memory.edited", MEMORY_IDS.codingStandards),
          audit("loop.improved", LOOP_IDS.securityReview)
        ]
      },
      WORKSPACE_IDS.team
    );

    expect(progress.completedCount).toBe(progress.steps.length);
    expect(progress.percent).toBe(100);
  });
});
