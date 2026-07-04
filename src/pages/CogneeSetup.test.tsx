import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { CogneeSetup } from "./CogneeSetup";
import type { CogneeStatus } from "../services/cognee";

const status: CogneeStatus = {
  configured: false,
  message: "Cognee bridge is ready for setup.",
  mode: "demo-fallback",
  ok: false
};

describe("CogneeSetup", () => {
  test("lets the user use LoopOS Cognee Cloud without entering a key", () => {
    const onSave = vi.fn();

    render(<CogneeSetup connection={null} status={status} onRefresh={vi.fn()} onSave={onSave} onStartLocal={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /use cloud memory/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        authMode: "backend-demo",
        kind: "hosted-demo"
      })
    );
  });

  test("can request the local open source launcher", () => {
    const onStartLocal = vi.fn();

    render(<CogneeSetup connection={null} status={status} onRefresh={vi.fn()} onSave={vi.fn()} onStartLocal={onStartLocal} />);

    fireEvent.click(screen.getByRole("button", { name: /start local memory/i }));

    expect(onStartLocal).toHaveBeenCalled();
  });

  test("keeps user-provided keys inside the custom connection panel", () => {
    const onSave = vi.fn();

    render(<CogneeSetup connection={null} status={status} onRefresh={vi.fn()} onSave={onSave} onStartLocal={vi.fn()} />);

    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /custom connection/i }));
    fireEvent.click(screen.getByRole("button", { name: /custom cloud/i }));
    fireEvent.change(screen.getByLabelText(/api key/i), { target: { value: "cloud-key" } });
    fireEvent.click(screen.getByRole("button", { name: /save custom setup/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "cloud-key",
        authMode: "api-key",
        baseUrl: "https://api.cognee.ai",
        kind: "cloud"
      })
    );
  });
});
