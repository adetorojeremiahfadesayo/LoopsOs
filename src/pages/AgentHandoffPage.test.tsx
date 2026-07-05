import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createSeedState, LOOP_IDS, WORKSPACE_IDS } from "../domain/seed";
import { AgentHandoffPage } from "./AgentHandoffPage";

describe("AgentHandoffPage", () => {
  test("previews handoff content and switches agent commands", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;

    render(
      <AgentHandoffPage
        lastImprovement={null}
        selectedLoopId={LOOP_IDS.securityReview}
        state={state}
        workspace={workspace}
        onCompleteRun={vi.fn()}
        onSelectLoop={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /agent handoff/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /how cognee improved this loop/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /run and recall loop/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/handoff ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Improved summary")).not.toBeInTheDocument();
    expect(screen.queryByText("Memory used")).not.toBeInTheDocument();
    expect(screen.queryByText("Next loop")).not.toBeInTheDocument();
    expect((screen.getByLabelText(/handoff prompt preview/i) as HTMLTextAreaElement).value).toContain(
      "## Generated Markdown Files"
    );
    expect((screen.getByLabelText(/cli command/i) as HTMLTextAreaElement).value).toContain("codex exec");

    fireEvent.click(screen.getByRole("button", { name: /claude code/i }));

    expect((screen.getByLabelText(/cli command/i) as HTMLTextAreaElement).value).toContain("claude -p");
    expect((screen.getByLabelText(/handoff prompt preview/i) as HTMLTextAreaElement).value).toContain(
      "Target agent: Claude Code"
    );
  });
});
