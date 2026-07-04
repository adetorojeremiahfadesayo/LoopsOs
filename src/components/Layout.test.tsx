import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Layout } from "./Layout";
import { createSeedState, USER_IDS, WORKSPACE_IDS } from "../domain/seed";

describe("Layout", () => {
  it("routes to the supervisor page from navigation", () => {
    const state = createSeedState();
    const workspace = state.workspaces.find((item) => item.id === WORKSPACE_IDS.solo)!;
    const user = state.users.find((item) => item.id === USER_IDS.solo)!;
    const onPageChange = vi.fn();

    render(
      <Layout
        activePage="dashboard"
        cogneeConnection={null}
        state={state}
        user={user}
        workspace={workspace}
        onPageChange={onPageChange}
        onReset={vi.fn()}
        onUserChange={vi.fn()}
        onWorkspaceChange={vi.fn()}
      >
        <p>Dashboard body</p>
      </Layout>
    );

    fireEvent.click(screen.getAllByRole("button", { name: /supervisor/i })[0]);

    expect(onPageChange).toHaveBeenCalledWith("supervisor");
  });
});
