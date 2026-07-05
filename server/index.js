import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createCogneeClient } from "./cogneeClient.js";
import { loadDotEnv } from "./env.js";
import { createLocalCogneeLauncher } from "./localCognee.js";
import { createQwenSupervisor } from "./qwenSupervisor.js";
import { envFromRuntimeHeaders } from "./runtimeConfig.js";

const DEFAULT_PORT = 8787;
const DIST_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
loadDotEnv();
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || process.env.LOOPOS_API_PORT || DEFAULT_PORT);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

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

function sendFile(response, filePath) {
  response.writeHead(200, {
    "Content-Type": contentTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}

async function staticFileForPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const candidate = path.resolve(DIST_DIR, relativePath);

  if (candidate !== DIST_DIR && !candidate.startsWith(`${DIST_DIR}${path.sep}`)) {
    return null;
  }

  try {
    const fileStat = await stat(candidate);
    if (fileStat.isFile()) {
      return candidate;
    }
  } catch {
    // Fall through to the SPA index fallback below.
  }

  const indexFile = path.resolve(DIST_DIR, "index.html");
  try {
    const indexStat = await stat(indexFile);
    return indexStat.isFile() ? indexFile : null;
  } catch {
    return null;
  }
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

    if (request.method === "GET" && !url.pathname.startsWith("/api/")) {
      const filePath = await staticFileForPath(url.pathname);
      if (filePath) {
        sendFile(response, filePath);
        return;
      }
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

  server.listen(PORT, HOST, () => {
    console.log(`LoopOS server listening on http://${HOST}:${PORT}`);
  });
}

export { route };
