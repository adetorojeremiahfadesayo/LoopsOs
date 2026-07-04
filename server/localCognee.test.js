// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { createLocalCogneeLauncher } from "./localCognee.js";

describe("local Cognee launcher", () => {
  test("returns docker-missing when Docker is not available", async () => {
    const execFileImpl = vi.fn((_cmd, _args, callback) => callback(new Error("docker missing"), "", ""));
    const launcher = createLocalCogneeLauncher({ execFileImpl, env: { LLM_API_KEY: "key" } });

    await expect(launcher.start()).resolves.toMatchObject({
      mode: "docker-missing",
      ok: false
    });
  });

  test("starts local Cognee with Ollama and Fastembed defaults when no key is present", async () => {
    const execFileImpl = vi.fn((_cmd, _args, callback) => callback(null, "Docker version 1", ""));
    const launcher = createLocalCogneeLauncher({ execFileImpl, env: {} });

    await expect(launcher.start()).resolves.toMatchObject({
      baseUrl: "http://127.0.0.1:8000",
      mode: "starting",
      ok: true
    });
    const dockerRunArgs = execFileImpl.mock.calls[1][1];
    expect(dockerRunArgs).toContain("LLM_PROVIDER=ollama");
    expect(dockerRunArgs).toContain("EMBEDDING_PROVIDER=fastembed");
    expect(dockerRunArgs).toContain("LLM_API_KEY=ollama");
  });

  test("starts the Cognee Docker API server with backend env only", async () => {
    const execFileImpl = vi.fn((_cmd, _args, callback) => callback(null, "ok", ""));
    const launcher = createLocalCogneeLauncher({
      execFileImpl,
      env: {
        LLM_API_KEY: "private-llm-key"
      }
    });

    const result = await launcher.start();

    expect(result).toMatchObject({
      baseUrl: "http://127.0.0.1:8000",
      mode: "starting",
      ok: true
    });
    expect(execFileImpl).toHaveBeenCalledWith("docker", ["--version"], expect.any(Function));
    expect(execFileImpl).toHaveBeenCalledWith(
      "docker",
      expect.arrayContaining(["run", "-d", "--name", "loopos-cognee", "-p", "8000:8000", "cognee/cognee:main"]),
      expect.any(Function)
    );
    const dockerRunArgs = execFileImpl.mock.calls[1][1];
    expect(dockerRunArgs).toContain("LLM_API_KEY=private-llm-key");
  });
});
