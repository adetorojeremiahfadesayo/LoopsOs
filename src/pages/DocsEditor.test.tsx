import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createSeedState, MEMORY_IDS, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import { DocsEditor } from "./DocsEditor";

function renderDocs(userId = USER_IDS.developer) {
  const state = createSeedState();
  const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.team)!;
  const user = state.users.find((item) => item.id === userId)!;
  const onIngest = vi.fn();
  const onRestrictToManagers = vi.fn();
  const onSave = vi.fn();

  render(
    <DocsEditor
      state={state}
      user={user}
      workspace={workspace}
      onIngest={onIngest}
      onRestrictToManagers={onRestrictToManagers}
      onSave={onSave}
    />
  );

  return { onIngest, onRestrictToManagers, onSave };
}

describe("DocsEditor", () => {
  test("lets editors save Markdown changes to visible memory documents", () => {
    const { onSave } = renderDocs();

    fireEvent.click(screen.getByRole("button", { name: /coding standards/i }));
    fireEvent.change(screen.getByLabelText(/document title/i), {
      target: { value: "Updated Coding Standards" }
    });
    fireEvent.change(screen.getByLabelText(/markdown body/i), {
      target: { value: "# Updated Coding Standards\nPrefer focused tests before UI work." }
    });
    fireEvent.click(screen.getByRole("button", { name: /save document/i }));

    expect(onSave).toHaveBeenCalledWith(MEMORY_IDS.codingStandards, {
      body: "# Updated Coding Standards\nPrefer focused tests before UI work.",
      title: "Updated Coding Standards",
      type: "team-rules"
    });
  });

  test("keeps viewers read-only and hides restricted documents they cannot view", () => {
    renderDocs(USER_IDS.viewer);

    expect(screen.queryByRole("button", { name: /security rules/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/document title/i)).toBeDisabled();
    expect(screen.getByLabelText(/markdown body/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /save document/i })).toBeDisabled();
  });
});
