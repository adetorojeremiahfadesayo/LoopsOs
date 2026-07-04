import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createSeedState, LOOP_IDS, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import { LoopBuilder } from "./LoopBuilder";

describe("LoopBuilder", () => {
  test("shows the selected loop editor with one bottom run command", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
    const user = state.users.find((item) => item.id === USER_IDS.manager)!;

    render(
      <LoopBuilder
        lastImprovement={null}
        selectedLoopId={LOOP_IDS.securityReview}
        state={state}
        user={user}
        workspace={workspace}
        onRunAndRecallLoop={vi.fn()}
      />
    );

    expect(screen.queryByRole("heading", { name: /workspace loops/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guild security review loop/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run and recall loop/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /export loop/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /agent handoff/i })).not.toBeInTheDocument();
  });
});
