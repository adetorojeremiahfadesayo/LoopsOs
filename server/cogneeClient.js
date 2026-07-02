const DEFAULT_COGNEE_BASE_URL = "http://127.0.0.1:8000";

function cleanSegment(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72);
}

function normalizeBaseUrl(value) {
  return (value || DEFAULT_COGNEE_BASE_URL).replace(/\/+$/g, "");
}

function joinUrl(baseUrl, path) {
  return `${normalizeBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

export function datasetNameForMemorySource(source) {
  return `loopos_${cleanSegment(source.workspaceId)}_${cleanSegment(source.id)}`;
}

export function datasetNameForRun(run) {
  return `loopos_${cleanSegment(run.workspaceId)}_${cleanSegment(run.loopId)}_runs`;
}

export function buildAuthHeaders(env = process.env) {
  const mode = (env.COGNEE_AUTH_MODE || "").toLowerCase();
  const apiKey = env.COGNEE_API_KEY || env.COGNEE_TOKEN || "";
  const baseUrl = normalizeBaseUrl(env.COGNEE_BASE_URL);

  if (mode === "none" || !apiKey) {
    return {};
  }

  if (mode === "api-key" || baseUrl.includes("api.cognee.ai")) {
    return { "X-Api-Key": apiKey };
  }

  return { Authorization: `Bearer ${apiKey}` };
}

function createMarkdownFile(name, body) {
  return new Blob([body], { type: "text/markdown" });
}

function sourceToMarkdown(source) {
  return [
    `# ${source.title}`,
    "",
    `Type: ${source.type}`,
    `LoopOS source id: ${source.id}`,
    `Workspace id: ${source.workspaceId}`,
    "",
    source.body
  ].join("\n");
}

function runToMarkdown(run) {
  return [
    `# LoopOS run notes for ${run.loopId}`,
    "",
    `Run id: ${run.id}`,
    `Created at: ${run.createdAt}`,
    "",
    "## Generated plan",
    run.generatedPlan,
    "",
    "## Outcome notes",
    run.outcomeNotes,
    "",
    "## Improvement suggestions",
    ...(run.improvementSuggestions || []).map((item) => `- ${item}`)
  ].join("\n");
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function ensureOk(response, action) {
  const payload = await parseResponse(response);
  if (!response.ok) {
    const detail = typeof payload === "string" ? payload : payload?.detail || payload?.message || response.statusText;
    throw new Error(`Cognee ${action} failed (${response.status}): ${detail}`);
  }
  return payload;
}

function createRememberForm({ markdown, datasetName, filename }) {
  const form = new FormData();
  form.append("data", createMarkdownFile(filename, markdown), filename);
  form.append("datasetName", datasetName);
  form.append("chunk_size", "1024");
  form.append("chunks_per_batch", "20");
  form.append("run_in_background", "false");
  return form;
}

function queryForLoop(loop) {
  return [
    `Loop name: ${loop.name}`,
    `Goal: ${loop.goal}`,
    `Memory rules: ${(loop.memoryRules || []).join(" ")}`,
    `Validation checks: ${(loop.validationChecks || []).join(" ")}`
  ].join("\n");
}

function extractSearchText(payload) {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => item?.search_result || item?.result || item?.text || item?.content || "")
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof payload === "string") {
    return payload;
  }

  return payload?.search_result || payload?.result || payload?.answer || payload?.message || "";
}

export function createCogneeClient({ env = process.env, fetchImpl = fetch } = {}) {
  const baseUrl = normalizeBaseUrl(env.COGNEE_BASE_URL);

  async function rememberMarkdown({ markdown, datasetName, filename }) {
    const response = await fetchImpl(joinUrl(baseUrl, "/api/v1/remember"), {
      method: "POST",
      headers: buildAuthHeaders(env),
      body: createRememberForm({ markdown, datasetName, filename })
    });
    await ensureOk(response, "remember");
  }

  return {
    async status() {
      try {
        const response = await fetchImpl(joinUrl(baseUrl, "/health"), {
          headers: buildAuthHeaders(env)
        });
        await ensureOk(response, "health check");

        const apiResponse = await fetchImpl(joinUrl(baseUrl, "/api/v1/datasets"), {
          headers: buildAuthHeaders(env)
        });

        if (apiResponse.status === 404) {
          throw new Error(`${baseUrl} is reachable, but it does not expose Cognee v1 API endpoints.`);
        }

        if (apiResponse.status === 401 || apiResponse.status === 403) {
          return {
            baseUrl,
            configured: Boolean(env.COGNEE_API_KEY || env.COGNEE_TOKEN),
            message: `Cognee v1 API is reachable at ${baseUrl}, but authentication is required or rejected.`,
            mode: "demo-fallback",
            ok: false
          };
        }

        await ensureOk(apiResponse, "datasets check");

        return {
          baseUrl,
          configured: true,
          message: `Connected to Cognee at ${baseUrl}.`,
          mode: "live",
          ok: true
        };
      } catch (error) {
        return {
          baseUrl,
          configured: Boolean(env.COGNEE_BASE_URL || env.COGNEE_API_KEY || env.COGNEE_TOKEN),
          message: error instanceof Error ? error.message : "Cognee is not reachable.",
          mode: "demo-fallback",
          ok: false
        };
      }
    },

    async rememberMemorySource(source) {
      const datasetName = datasetNameForMemorySource(source);
      await rememberMarkdown({
        datasetName,
        filename: `${cleanSegment(source.id) || "memory"}.md`,
        markdown: sourceToMarkdown(source)
      });

      return {
        cogneeMemoryId: datasetName,
        datasetName,
        mode: "live"
      };
    },

    async recallForLoop({ loop, allowedSources }) {
      const searchableSources = allowedSources.filter((source) => source.ingestionStatus === "ingested");
      const datasets = searchableSources.map(datasetNameForMemorySource);

      if (datasets.length === 0) {
        return {
          mode: "live",
          sourceIds: [],
          sourceTitles: [],
          summary: `Cognee found no ingested memory visible to this user for "${loop.name}".`
        };
      }

      const response = await fetchImpl(joinUrl(baseUrl, "/api/v1/search"), {
        method: "POST",
        headers: {
          ...buildAuthHeaders(env),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          datasets,
          query: queryForLoop(loop),
          search_type: "GRAPH_COMPLETION",
          top_k: 10
        })
      });
      const payload = await ensureOk(response, "search");
      const summary = extractSearchText(payload) || `Cognee searched ${datasets.length} allowed dataset(s).`;

      return {
        mode: "live",
        sourceIds: searchableSources.map((source) => source.id),
        sourceTitles: searchableSources.map((source) => source.title),
        summary
      };
    },

    async storeRunNotes(run) {
      const datasetName = datasetNameForRun(run);
      await rememberMarkdown({
        datasetName,
        filename: `${cleanSegment(run.id) || "run"}.md`,
        markdown: runToMarkdown(run)
      });

      return {
        datasetName,
        message: `Cognee stored run notes in ${datasetName}.`,
        mode: "live"
      };
    }
  };
}
