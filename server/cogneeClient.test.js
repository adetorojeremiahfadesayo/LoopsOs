// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import {
  buildAuthHeaders,
  createCogneeClient,
  datasetNameForLoopFile,
  datasetNameForMemorySource,
  datasetNameForRun
} from "./cogneeClient.js";

const source = {
  id: "Memory Source:42",
  workspaceId: "Team Workspace!",
  title: "Security Rules",
  type: "security-policy",
  body: "# Security\nOnly managers can update auth rules.",
  ingestionStatus: "ingested"
};

const loop = {
  id: "loop-1",
  name: "Security Review Loop",
  goal: "Find auth and ownership gaps.",
  memoryRules: ["Recall project rules before checking code."],
  validationChecks: ["Every owner check is explicit."]
};

describe("Cognee HTTP client", () => {
  test("derives stable per-source dataset names", () => {
    expect(datasetNameForMemorySource(source)).toBe("loopos_team_workspace_memory_source_42");
    expect(datasetNameForLoopFile({ workspaceId: "Team Workspace!", id: "Loop A" }, { id: "File 1" })).toBe(
      "loopos_team_workspace_loop_a_file_1"
    );
    expect(datasetNameForRun({ workspaceId: "Team Workspace!", loopId: "Loop A" })).toBe(
      "loopos_team_workspace_loop_a_runs"
    );
  });

  test("builds cloud and local auth headers from environment", () => {
    expect(
      buildAuthHeaders({
        COGNEE_BASE_URL: "https://api.cognee.ai",
        COGNEE_API_KEY: "cloud-key"
      })
    ).toEqual({ "X-Api-Key": "cloud-key" });

    expect(
      buildAuthHeaders({
        COGNEE_BASE_URL: "http://127.0.0.1:8000",
        COGNEE_API_KEY: "local-token"
      })
    ).toEqual({ Authorization: "Bearer local-token" });

    expect(
      buildAuthHeaders({
        COGNEE_AUTH_MODE: "none",
        COGNEE_API_KEY: "ignored"
      })
    ).toEqual({});
  });

  test("reports api mismatch when health exists but the Cognee v1 API is missing", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (String(url).endsWith("/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }

      return new Response("missing", { status: 404 });
    });
    const client = createCogneeClient({
      env: { COGNEE_BASE_URL: "http://127.0.0.1:8000" },
      fetchImpl
    });

    const status = await client.status();

    expect(fetchImpl).toHaveBeenCalledWith("http://127.0.0.1:8000/api/v1/datasets", expect.any(Object));
    expect(status.ok).toBe(false);
    expect(status.mode).toBe("api-mismatch");
    expect(status.message).toContain("does not expose Cognee v1 API");
  });

  test("reports auth needed when the Cognee v1 API rejects credentials", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (String(url).endsWith("/health")) {
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }

      return new Response("forbidden", { status: 403 });
    });
    const client = createCogneeClient({
      env: { COGNEE_BASE_URL: "http://127.0.0.1:8000", COGNEE_API_KEY: "bad-token" },
      fetchImpl
    });

    const status = await client.status();

    expect(status.ok).toBe(false);
    expect(status.mode).toBe("auth-needed");
    expect(status.message).toContain("authentication");
  });

  test("reports live when health and datasets are reachable", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = createCogneeClient({
      env: { COGNEE_BASE_URL: "http://127.0.0.1:8000" },
      fetchImpl
    });

    const status = await client.status();

    expect(status.ok).toBe(true);
    expect(status.mode).toBe("live");
    expect(status.message).toContain("Connected to Cognee");
  });

  test("adds and cognifies a memory source in its own Cognee dataset", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "processed" }), { status: 200 }));
    const client = createCogneeClient({
      env: {
        COGNEE_BASE_URL: "http://127.0.0.1:8000",
        COGNEE_API_KEY: "token"
      },
      fetchImpl
    });

    const result = await client.rememberMemorySource(source);

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/add",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer token" }
      })
    );
    const form = fetchImpl.mock.calls[0][1].body;
    expect(form.get("datasetName")).toBe("loopos_team_workspace_memory_source_42");
    expect(form.get("run_in_background")).toBe("false");
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/cognify",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer token", "Content-Type": "application/json" },
        body: JSON.stringify({
          datasets: ["loopos_team_workspace_memory_source_42"],
          run_in_background: false
        })
      })
    );
    expect(result).toEqual({
      cogneeMemoryId: "loopos_team_workspace_memory_source_42",
      datasetName: "loopos_team_workspace_memory_source_42",
      mode: "live"
    });
  });

  test("falls back to remember when add is not available", async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (String(url).endsWith("/api/v1/add")) {
        return new Response("missing", { status: 404 });
      }

      return new Response(JSON.stringify({ id: "remembered" }), { status: 200 });
    });
    const client = createCogneeClient({
      env: { COGNEE_BASE_URL: "http://127.0.0.1:8000" },
      fetchImpl
    });

    const result = await client.rememberMemorySource(source);

    expect(fetchImpl.mock.calls.map((call) => call[0])).toContain("http://127.0.0.1:8000/api/v1/remember");
    expect(result.datasetName).toBe("loopos_team_workspace_memory_source_42");
  });

  test("recalls only the datasets for allowed sources", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify([
            {
              search_result: "Use Project Overview and Security Rules before executing the loop.",
              dataset_name: "loopos_team_workspace_memory_source_42"
            }
          ]),
          { status: 200 }
        )
    );
    const client = createCogneeClient({
      env: { COGNEE_BASE_URL: "http://127.0.0.1:8000" },
      fetchImpl
    });

    const result = await client.recallForLoop({ loop, allowedSources: [source] });

    const payload = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(fetchImpl.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/v1/search");
    expect(payload.datasets).toEqual(["loopos_team_workspace_memory_source_42"]);
    expect(payload.query).toContain("Find auth and ownership gaps.");
    expect(result.summary).toContain("Use Project Overview");
    expect(result.sourceIds).toEqual(["Memory Source:42"]);
    expect(result.sourceTitles).toEqual(["Security Rules"]);
    expect(result.mode).toBe("live");
  });

  test("stores run notes as Cognee memory", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = createCogneeClient({
      env: { COGNEE_BASE_URL: "http://127.0.0.1:8000" },
      fetchImpl
    });

    const result = await client.storeRunNotes({
      id: "run-1",
      workspaceId: "Team Workspace!",
      loopId: "Loop A",
      generatedPlan: "Run with recalled memory.",
      outcomeNotes: "Add owner checks next time.",
      improvementSuggestions: ["Split validation from generation."],
      createdAt: "2026-07-02T10:00:00.000Z"
    });

    const form = fetchImpl.mock.calls[0][1].body;
    expect(form.get("datasetName")).toBe("loopos_team_workspace_loop_a_runs");
    expect(result).toEqual({
      datasetName: "loopos_team_workspace_loop_a_runs",
      message: "Cognee stored run notes in loopos_team_workspace_loop_a_runs.",
      mode: "live"
    });
  });

  test("remembers loop files as Cognee memory", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = createCogneeClient({
      env: { COGNEE_BASE_URL: "http://127.0.0.1:8000" },
      fetchImpl
    });

    const result = await client.rememberLoopFile({
      loop: { id: "Loop A", workspaceId: "Team Workspace!", name: "Loop A" },
      file: { id: "File 1", path: "loop/LOOP.md", body: "# LOOP.md" }
    });

    const form = fetchImpl.mock.calls[0][1].body;
    expect(form.get("datasetName")).toBe("loopos_team_workspace_loop_a_file_1");
    expect(result.cogneeMemoryId).toBe("loopos_team_workspace_loop_a_file_1");
  });

  test("forgets a memory source by dataset", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = createCogneeClient({
      env: { COGNEE_BASE_URL: "http://127.0.0.1:8000" },
      fetchImpl
    });

    const result = await client.forgetMemorySource({
      ...source,
      cogneeMemoryId: "loopos_custom_dataset"
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/v1/forget",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset: "loopos_custom_dataset" })
      })
    );
    expect(result.message).toContain("loopos_custom_dataset");
  });
});
