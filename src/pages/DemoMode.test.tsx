import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createSeedState, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import type { CogneeStatus } from "../services/cognee";
import { DemoMode } from "./DemoMode";

const demoFallbackStatus: CogneeStatus = {
  configured: false,
  message: "Cognee bridge is unavailable, so LoopOS is using the demo fallback.",
  mode: "demo-fallback",
  ok: false
};

describe("DemoMode", () => {
  test("shows the hackathon pitch, demo flow, commands, and Cognee status", () => {
    const state = createSeedState();
    state.selectedWorkspaceId = WORKSPACE_IDS.team;
    const onNavigate = vi.fn();
    const onSelectUser = vi.fn();

    render(
      <DemoMode
        cogneeStatus={demoFallbackStatus}
        state={state}
        onNavigate={onNavigate}
        onSelectUser={onSelectUser}
      />
    );

    expect(screen.getByRole("heading", { name: /hackathon demo/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /demo checklist/i })).toBeInTheDocument();
    expect(screen.getByText(/4\/6 complete/i)).toBeInTheDocument();
    expect(screen.getByText(/AI that does not forget/i)).toBeInTheDocument();
    expect(screen.getByText(/Run and Recall Loop/i)).toBeInTheDocument();
    expect(screen.getByText(/npm run dev:full/i)).toBeInTheDocument();
    expect(screen.getAllByText(/demo fallback/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /open workspace/i }));
    fireEvent.click(screen.getByRole("button", { name: /switch to viewer/i }));

    expect(onNavigate).toHaveBeenCalledWith("workspace");
    expect(onSelectUser).toHaveBeenCalledWith(USER_IDS.viewer);
  });
});
