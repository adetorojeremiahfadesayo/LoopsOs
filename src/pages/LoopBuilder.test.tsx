import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createSeedState, LOOP_IDS, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import { LoopBuilder } from "./LoopBuilder";

describe("LoopBuilder", () => {
  test("previews export content for the selected loop format", () => {
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
        onCompleteRun={vi.fn()}
        onImproveLoop={vi.fn()}
        onSaveLoop={vi.fn()}
        onSelectLoop={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/export format/i), { target: { value: "json" } });

    expect(screen.getByRole("heading", { name: /export loop/i })).toBeInTheDocument();
    expect((screen.getByLabelText(/export preview/i) as HTMLTextAreaElement).value).toContain(
      '"name": "Guild Security Review Loop"'
    );
  });
});
