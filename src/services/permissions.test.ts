import { describe, expect, test } from "vitest";
import { createSeedState, MEMORY_IDS, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import { canEditLoop, canManageWorkspace, canViewMemorySource, getWorkspaceRole } from "./permissions";

describe("permissions", () => {
  test("owners and managers can access restricted memory sources", () => {
    const state = createSeedState();
    const securityRules = state.memorySources.find((source) => source.id === MEMORY_IDS.securityRules)!;

    expect(canViewMemorySource(state, securityRules, USER_IDS.manager)).toBe(true);
  });

  test("editors can access restricted memory only when explicitly allowed", () => {
    const state = createSeedState();
    const securityRules = state.memorySources.find((source) => source.id === MEMORY_IDS.securityRules)!;

    expect(canViewMemorySource(state, securityRules, USER_IDS.developer)).toBe(true);

    const restrictedWithoutDeveloper = {
      ...securityRules,
      access: { visibility: "restricted" as const, allowedUserIds: [USER_IDS.manager] }
    };

    expect(canViewMemorySource(state, restrictedWithoutDeveloper, USER_IDS.developer)).toBe(false);
  });

  test("viewers cannot edit loops", () => {
    const state = createSeedState();
    const loop = state.loops.find((item) => item.workspaceId === WORKSPACE_IDS.team && !item.isTemplate)!;

    expect(canEditLoop(state, loop, USER_IDS.viewer)).toBe(false);
  });

  test("solo users can access solo workspace memory", () => {
    const state = createSeedState();
    const soloMemory = state.memorySources.find((source) => source.workspaceId === WORKSPACE_IDS.solo)!;

    expect(canViewMemorySource(state, soloMemory, USER_IDS.solo)).toBe(true);
  });

  test("workspace role lookup and management checks reflect member roles", () => {
    const state = createSeedState();

    expect(getWorkspaceRole(state, WORKSPACE_IDS.team, USER_IDS.manager)).toBe("owner");
    expect(getWorkspaceRole(state, WORKSPACE_IDS.team, USER_IDS.developer)).toBe("editor");
    expect(canManageWorkspace(state, WORKSPACE_IDS.team, USER_IDS.manager)).toBe(true);
    expect(canManageWorkspace(state, WORKSPACE_IDS.team, USER_IDS.developer)).toBe(false);
  });
});
