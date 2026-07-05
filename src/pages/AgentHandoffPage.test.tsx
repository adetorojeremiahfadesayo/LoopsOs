import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createSeedState, LOOP_IDS, WORKSPACE_IDS } from "../domain/seed";
import { AgentHandoffPage } from "./AgentHandoffPage";

describe("AgentHandoffPage", () => {
  test("previews handoff content and switches agent commands", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
    const onCompleteRun = vi.fn();

    render(
      <AgentHandoffPage
        lastImprovement={null}
        selectedLoopId={LOOP_IDS.securityReview}
        state={state}
        workspace={workspace}
        onCompleteRun={onCompleteRun}
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

    fireEvent.click(screen.getByRole("button", { name: /use demo finish run/i }));

    const finishRunNotes = screen.getByPlaceholderText(
      /what happened\? what should be saved for the next loop\?/i
    ) as HTMLTextAreaElement;
    expect(finishRunNotes.value).toContain("The agent completed the improved Web Builder loop");
    expect(finishRunNotes.value).toContain("accessibility checks");
    const submittedRunNotes = finishRunNotes.value;

    fireEvent.click(screen.getByRole("button", { name: /^finish run$/i }));

    expect(onCompleteRun).toHaveBeenCalledWith(
      expect.objectContaining({
        loopId: LOOP_IDS.securityReview,
        outcomeNotes: submittedRunNotes
      })
    );
  });
});
