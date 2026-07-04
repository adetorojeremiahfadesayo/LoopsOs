import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { createSeedState, USER_IDS, WORKSPACE_IDS } from "../domain/seed";
import { duplicateTemplate } from "../services/loopActions";
import { LoopWorkspace } from "./LoopWorkspace";

describe("LoopWorkspace", () => {
  test("edits generated files, creates new files, and shows dynamic context", async () => {
    const seed = createSeedState();
    const duplicated = await duplicateTemplate(seed, {
      actorId: USER_IDS.solo,
      templateId: "template-web-builder-maintainer",
      workspaceId: WORKSPACE_IDS.solo
    });
    const workspace = duplicated.state.workspaces.find((item) => item.id === WORKSPACE_IDS.solo)!;
    const user = duplicated.state.users.find((item) => item.id === USER_IDS.solo)!;
    const onSaveFile = vi.fn();
    const onCreateFile = vi.fn();
    const onSelectLoop = vi.fn();

    render(
      <LoopWorkspace
        state={duplicated.state}
        user={user}
        workspace={workspace}
        selectedLoopId={duplicated.loopId}
        onCreateFile={onCreateFile}
        onSaveFile={onSaveFile}
        onSelectLoop={onSelectLoop}
      />
    );

    expect(screen.getByText("Loop File Workspace")).toBeInTheDocument();
    expect(screen.getByText("Workspace details")).toBeInTheDocument();
    expect(screen.getAllByText("LOOP.md").length).toBeGreaterThan(0);
    expect(screen.getByText("Template folders")).toBeInTheDocument();
    expect(screen.getByText("Files included")).toBeInTheDocument();
    expect(screen.getByText("Create new file")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Markdown body/i), {
      target: { value: "# LOOP.md\n\nUpdated loop contract." }
    });
    fireEvent.click(screen.getByRole("button", { name: /remember file/i }));

    expect(onSaveFile).toHaveBeenCalledWith(
      duplicated.loopId,
      expect.objectContaining({ body: expect.stringContaining("Updated loop contract") })
    );

    fireEvent.change(screen.getByLabelText(/Workspace detail panel/i), { target: { value: "preview" } });
    expect(screen.getAllByText("File preview").length).toBeGreaterThan(1);

    fireEvent.change(screen.getByLabelText(/New file name/i), { target: { value: "NOTES.md" } });
    fireEvent.change(screen.getByLabelText(/New folder/i), { target: { value: "notes" } });
    fireEvent.click(screen.getByRole("button", { name: /create file/i }));

    expect(onCreateFile).toHaveBeenCalledWith(
      duplicated.loopId,
      expect.objectContaining({ folder: "notes", name: "NOTES.md" })
    );
  });
});
