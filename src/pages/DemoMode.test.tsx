import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { createSeedState } from "../domain/seed";
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

    render(<DemoMode cogneeStatus={demoFallbackStatus} state={state} />);

    expect(screen.getByRole("heading", { name: /hackathon demo/i })).toBeInTheDocument();
    expect(screen.getByText(/AI that does not forget/i)).toBeInTheDocument();
    expect(screen.getByText(/Improve with Cognee/i)).toBeInTheDocument();
    expect(screen.getByText(/npm run dev:full/i)).toBeInTheDocument();
    expect(screen.getAllByText(/demo fallback/i).length).toBeGreaterThan(0);
  });
});
