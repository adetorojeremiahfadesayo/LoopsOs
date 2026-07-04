import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createSeedState, WORKSPACE_IDS } from "../domain/seed";
import { Templates } from "./Templates";

describe("Templates", () => {
  test("shows the five MVP templates and their generated markdown files", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.solo)!;
    const onDuplicate = vi.fn();

    render(<Templates state={state} workspace={workspace} onDuplicate={onDuplicate} />);

    expect(screen.getByText("Web Builder & Maintainer")).toBeInTheDocument();
    expect(screen.getByText("Research Agent")).toBeInTheDocument();
    expect(screen.getByText("Code Review Agent")).toBeInTheDocument();
    expect(screen.getByText("Customer Support Agent")).toBeInTheDocument();
    expect(screen.getByText("Docs Maintainer")).toBeInTheDocument();
    expect(screen.getAllByText("LOOP.md").length).toBeGreaterThan(0);
    expect(screen.getAllByText("HANDOFF.md").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /use template/i })[0]);

    expect(onDuplicate).toHaveBeenCalledWith("template-web-builder-maintainer");
  });
});
