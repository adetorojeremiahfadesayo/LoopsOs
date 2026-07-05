import http from "node:http";
import { pathToFileURL } from "node:url";
import { createCogneeClient } from "./cogneeClient.js";
import { loadDotEnv } from "./env.js";
import { createLocalCogneeLauncher } from "./localCognee.js";
import { createQwenSupervisor } from "./qwenSupervisor.js";
import { envFromRuntimeHeaders } from "./runtimeConfig.js";

const DEFAULT_PORT = 8787;
loadDotEnv();
const PORT = Number(process.env.LOOPOS_API_PORT || DEFAULT_PORT);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Api-Key, X-LoopOS-Cognee-Api-Key, X-LoopOS-Cognee-Auth-Mode, X-LoopOS-Cognee-Base-Url, X-LoopOS-Cognee-Use-Hosted-Demo",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

function clientForRequest(request, client) {
  if (client) {
    return client;
  }

  return createCogneeClient({
    env: envFromRuntimeHeaders(request)
  });
}

async function route(
  request,
  response,
  client = null,
  localCognee = createLocalCogneeLauncher(),
  qwenSupervisor = createQwenSupervisor()
) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
  const cogneeClient = clientForRequest(request, client);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    if (request.method === "GET" && url.pathname === "/api/cognee/status") {
      sendJson(response, 200, await cogneeClient.status());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/cognee/ingest") {
      const { source } = await readJson(request);
      sendJson(response, 200, await cogneeClient.rememberMemorySource(source));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/cognee/remember-loop-file") {
      const payload = await readJson(request);
      sendJson(response, 200, await cogneeClient.rememberLoopFile(payload));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/cognee/forget") {
      const { source } = await readJson(request);
      sendJson(response, 200, await cogneeClient.forgetMemorySource(source));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/cognee/recall") {
      const payload = await readJson(request);
      sendJson(response, 200, await cogneeClient.recallForLoop(payload));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/cognee/store-run") {
      const { run } = await readJson(request);
      sendJson(response, 200, await cogneeClient.storeRunNotes(run));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/cognee/local/start") {
      sendJson(response, 200, await localCognee.start());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/agent/supervisor") {
      sendJson(response, 200, await qwenSupervisor.review(await readJson(request)));
      return;
    }

    sendJson(response, 404, { message: "Route not found." });
  } catch (error) {
    sendJson(response, 502, {
      message: error instanceof Error ? error.message : "LoopOS API bridge request failed.",
      mode: "demo-fallback",
      ok: false
    });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = http.createServer((request, response) => {
    void route(request, response);
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`LoopOS API bridge listening on http://127.0.0.1:${PORT}`);
  });
}

export { route };
