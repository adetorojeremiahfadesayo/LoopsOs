import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSeedState, WORKSPACE_IDS } from "../domain/seed";
import { SupervisorPage } from "./SupervisorPage";

describe("SupervisorPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a senior engineer supervisor overview for two agents", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;

    render(<SupervisorPage state={state} workspace={workspace} onContinue={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Supervisor" })).toBeInTheDocument();
    expect(screen.getByText("Senior AI engineer oversight for active agent loops.")).toBeInTheDocument();
    expect(screen.getAllByText("Codex").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Claude Code").length).toBeGreaterThan(0);
    expect(screen.getByText("Live agent monitor")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Supervisor verdict" })).toBeInTheDocument();
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
    expect(screen.getByText(/Supervisor started streaming Codex and Claude Code activity/i)).toBeInTheDocument();
  });

  it("shows the real Qwen supervisor verdict when monitoring is activated", async () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          disagreements: ["Claude Code log is not attached yet."],
          guardrails: ["Require human approval before deployment."],
          mode: "live",
          model: "qwen-plus",
          nextAction: "Continue with monitored execution.",
          riskLevel: "medium",
          summary: "Qwen verified this loop has enough evidence for supervised execution.",
          verdict: "Qwen supervisor active"
        }),
        { status: 200 }
      )
    );

    render(<SupervisorPage state={state} workspace={workspace} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /activate workflow/i }));

    await waitFor(() =>
      expect(screen.getAllByRole("heading", { name: "Qwen supervisor active" }).length).toBeGreaterThan(0)
    );
    expect(screen.getAllByText(/Qwen verified this loop/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Require human approval/i)).toBeInTheDocument();
  });

  it("formats a Qwen JSON string instead of dumping raw JSON into the verdict", async () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          mode: "live",
          model: "qwen-plus",
          summary: JSON.stringify({
            verdict: "caution",
            riskLevel: "medium",
            summary: "The loop is missing visible memory grounding.",
            guardrails: ["Require explicit confirmation of memory ingestion status before loop execution."],
            nextAction: "Halt further executions until memory is ingested.",
            disagreements: ["No Claude Code log is attached."]
          }),
          verdict: "Qwen supervisor active"
        }),
        { status: 200 }
      )
    );

    render(<SupervisorPage state={state} workspace={workspace} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /activate workflow/i }));

    await waitFor(() => expect(screen.getAllByRole("heading", { name: "caution" }).length).toBeGreaterThan(0));
    expect(screen.getAllByText("The loop is missing visible memory grounding.").length).toBeGreaterThan(0);
    expect(screen.getByText("Halt further executions until memory is ingested.")).toBeInTheDocument();
    expect(screen.getByText(/Require explicit confirmation of memory ingestion status/i)).toBeInTheDocument();
    expect(screen.queryByText(/\{\"verdict\":\"caution\"/)).not.toBeInTheDocument();
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
