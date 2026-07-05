import { fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: /improve loop/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /export loop/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /agent handoff/i })).not.toBeInTheDocument();
  });

  test("fills and submits a user improvement suggestion", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
    const user = state.users.find((item) => item.id === USER_IDS.manager)!;
    const onRunAndRecallLoop = vi.fn();

    render(
      <LoopBuilder
        lastImprovement={null}
        selectedLoopId={LOOP_IDS.securityReview}
        state={state}
        user={user}
        workspace={workspace}
        onRunAndRecallLoop={onRunAndRecallLoop}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /use demo suggestion/i }));
    expect(screen.getByLabelText(/suggest an improvement/i)).toHaveValue(
      "Make the agent stricter about mobile responsiveness, accessibility checks, and avoiding fake UI controls before handoff."
    );

    fireEvent.click(screen.getByRole("button", { name: /improve loop/i }));

    expect(onRunAndRecallLoop).toHaveBeenCalledWith(
      LOOP_IDS.securityReview,
      expect.any(Object),
      "Make the agent stricter about mobile responsiveness, accessibility checks, and avoiding fake UI controls before handoff."
    );
  });

  test("explains the user request in the improvement report", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
    const user = state.users.find((item) => item.id === USER_IDS.manager)!;

    render(
      <LoopBuilder
        lastImprovement={{
          generatedPlan: "User requested: Add stricter accessibility validation before handoff.",
          recalled: {
            mode: "demo-fallback",
            sourceIds: [],
            sourceTitles: [],
            summary: "Cognee found no ingested memory visible to this user."
          },
          suggestions: ["Add accessibility validation before handoff."],
          userRequest: "Add stricter accessibility validation before handoff."
        }}
        selectedLoopId={LOOP_IDS.securityReview}
        state={state}
        user={user}
        workspace={workspace}
        onRunAndRecallLoop={vi.fn()}
      />
    );

    expect(screen.getByText("User requested")).toBeInTheDocument();
    expect(screen.getByText("Add stricter accessibility validation before handoff.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /send this bundle to the agent/i })).toBeInTheDocument();
  });

  test("keeps the handoff ready panel at the bottom after improvement details", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
    const user = state.users.find((item) => item.id === USER_IDS.manager)!;

    render(
      <LoopBuilder
        lastImprovement={{
          generatedPlan: "Improved plan for the handoff bundle.",
          recalled: {
            mode: "demo-fallback",
            sourceIds: [],
            sourceTitles: [],
            summary: "Cognee found no ingested memory visible to this user."
          },
          suggestions: ["Add accessibility validation before handoff."]
        }}
        selectedLoopId={LOOP_IDS.securityReview}
        state={state}
        user={user}
        workspace={workspace}
        onRunAndRecallLoop={vi.fn()}
      />
    );

    const report = screen.getByRole("heading", { name: /how cognee improved this loop/i });
    const handoffReady = screen.getByRole("heading", { name: /send this bundle to the agent/i });

    expect(report.compareDocumentPosition(handoffReady) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
