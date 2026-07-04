import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createSeedState, WORKSPACE_IDS } from "../domain/seed";
import { SupervisorPage } from "./SupervisorPage";

describe("SupervisorPage", () => {
  it("shows a senior engineer supervisor overview for two agents", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;

    render(<SupervisorPage state={state} workspace={workspace} onContinue={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Supervisor" })).toBeInTheDocument();
    expect(screen.getByText("Senior AI engineer oversight for active agent loops.")).toBeInTheDocument();
    expect(screen.getAllByText("Codex").length).toBeGreaterThan(0);
    expect(screen.getByText("Claude Architect")).toBeInTheDocument();
    expect(screen.getByText("Live agent monitor")).toBeInTheDocument();
    expect(screen.getAllByText("Guild Security Review Loop").length).toBeGreaterThan(0);
  });

  it("hides guardrails behind an expandable button", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;

    render(<SupervisorPage state={state} workspace={workspace} onContinue={vi.fn()} />);

    expect(screen.getByRole("button", { name: /guardrails/i })).toBeInTheDocument();
    expect(screen.queryByText("Require approval for high-risk actions")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /guardrails/i }));

    expect(screen.getByText("Require approval for high-risk actions")).toBeInTheDocument();
    expect(screen.getByText(/delete files, change auth or security code/i)).toBeInTheDocument();
    expect(screen.getByText("Restricted memory is being watched")).toBeInTheDocument();
  });

  it("adds a live activity item when monitoring is activated", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;

    render(<SupervisorPage state={state} workspace={workspace} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /activate workflow/i }));

    expect(screen.getByText("Live monitor attached")).toBeInTheDocument();
    expect(screen.getByText(/Supervisor started streaming Codex and Claude Architect activity/i)).toBeInTheDocument();
  });

  it("continues the workflow from supervisor", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
    const onContinue = vi.fn();

    render(<SupervisorPage state={state} workspace={workspace} onContinue={onContinue} />);

    fireEvent.click(screen.getByRole("button", { name: /continue workflow/i }));

    expect(onContinue).toHaveBeenCalledOnce();
  });
});
