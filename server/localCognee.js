import { execFile } from "node:child_process";

const DEFAULT_LOCAL_BASE_URL = "http://127.0.0.1:8000";
const CONTAINER_NAME = "loopos-cognee";

function run(execFileImpl, command, args) {
  return new Promise((resolve) => {
    execFileImpl(command, args, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

function hasLocalModelConfig(env) {
  return Boolean(
    env.LLM_API_KEY ||
      env.OPENAI_API_KEY ||
      env.LOCAL_COGNEE_LLM_API_KEY ||
      env.OLLAMA_BASE_URL ||
      env.LLM_PROVIDER ||
      env.EMBEDDING_PROVIDER
  );
}

function dockerRunArgs(env) {
  const useLocalDefaults = !hasLocalModelConfig(env);
  const llmKey = env.LOCAL_COGNEE_LLM_API_KEY || env.LLM_API_KEY || env.OPENAI_API_KEY || "ollama";
  const args = ["run", "-d", "--name", CONTAINER_NAME, "-p", "8000:8000"];

  if (llmKey) {
    args.push("-e", `LLM_API_KEY=${llmKey}`);
  }

  if (useLocalDefaults) {
    args.push(
      "-e",
      "LLM_PROVIDER=ollama",
      "-e",
      "LLM_MODEL=llama3.1:8b",
      "-e",
      "LLM_ENDPOINT=http://host.docker.internal:11434/v1",
      "-e",
      "EMBEDDING_PROVIDER=fastembed",
      "-e",
      "EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2",
      "-e",
      "EMBEDDING_DIMENSIONS=384"
    );
  }

  if (env.OLLAMA_BASE_URL) {
    args.push("-e", `OLLAMA_BASE_URL=${env.OLLAMA_BASE_URL}`);
  }
  if (env.LLM_PROVIDER) {
    args.push("-e", `LLM_PROVIDER=${env.LLM_PROVIDER}`);
  }
  if (env.EMBEDDING_PROVIDER) {
    args.push("-e", `EMBEDDING_PROVIDER=${env.EMBEDDING_PROVIDER}`);
  }

  args.push("cognee/cognee:main");
  return args;
}

export function createLocalCogneeLauncher({ execFileImpl = execFile, env = process.env } = {}) {
  return {
    async start() {
      const dockerCheck = await run(execFileImpl, "docker", ["--version"]);
      if (dockerCheck.error) {
        return {
          message: "Docker is not available. Install Docker Desktop, then try starting local Cognee again.",
          mode: "docker-missing",
          ok: false
        };
      }

      const started = await run(execFileImpl, "docker", dockerRunArgs(env));
      if (started.error) {
        const text = `${started.stderr || ""} ${started.stdout || ""}`.toLowerCase();
        if (text.includes("already in use") || text.includes("already exists")) {
          return {
            baseUrl: DEFAULT_LOCAL_BASE_URL,
            message: "A local Cognee container already exists. Use the connection test to check whether it is ready.",
            mode: "already-running",
            ok: true
          };
        }

        return {
          message: started.stderr || started.error.message || "Could not start the local Cognee Docker container.",
          mode: "start-failed",
          ok: false
        };
      }

      return {
        baseUrl: DEFAULT_LOCAL_BASE_URL,
        message:
          "Local open source Cognee is starting on http://127.0.0.1:8000. If you are using no keys, keep Ollama running with llama3.1:8b.",
        mode: "starting",
        ok: true
      };
    }
  };
}
