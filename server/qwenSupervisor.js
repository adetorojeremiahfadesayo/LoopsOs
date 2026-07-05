const DEFAULT_QWEN_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DEFAULT_QWEN_MODEL = "qwen-plus";

function normalizeBaseUrl(value) {
  return (value || DEFAULT_QWEN_BASE_URL).replace(/\/+$/g, "");
}

function safeList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()) : [];
}

function parseJsonContent(content) {
  if (!content || typeof content !== "string") {
    return {};
  }

  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : content;
  const objectStart = candidate.indexOf("{");
  const objectEnd = candidate.lastIndexOf("}");
  const raw = objectStart >= 0 && objectEnd > objectStart ? candidate.slice(objectStart, objectEnd + 1) : candidate;

  try {
    return JSON.parse(raw);
  } catch {
    return { summary: content };
  }
}

function unpackNestedJsonSummary(payload) {
  if (!payload || typeof payload.summary !== "string") {
    return payload;
  }

  const nested = parseJsonContent(payload.summary);
  return nested && typeof nested === "object" && Object.keys(nested).length > 1
    ? { ...payload, ...nested }
    : payload;
}

function compactLoop(loop) {
  if (!loop) {
    return null;
  }

  return {
    goal: loop.goal,
    memoryRules: loop.memoryRules || [],
    name: loop.name || loop.title,
    validationChecks: loop.validationChecks || []
  };
}

function buildSupervisorMessages(payload) {
  const compactPayload = {
    auditEvents: (payload.auditEvents || []).slice(0, 8).map((event) => ({
      action: event.action,
      targetName: event.targetName,
      summary: event.afterSummary || event.beforeSummary || ""
    })),
    latestLoop: compactLoop(payload.latestLoop),
    memorySources: (payload.memorySources || []).slice(0, 8).map((source) => ({
      ingestionStatus: source.ingestionStatus,
      title: source.title,
      visibility: source.access?.visibility
    })),
    runs: (payload.runs || []).slice(0, 4).map((run) => ({
      generatedPlan: run.generatedPlan,
      outcomeNotes: run.outcomeNotes
    }))
  };

  return [
    {
      role: "system",
      content:
        "You are the LoopOS supervisor: a senior AI engineering reviewer for agent loops. Return only JSON with keys: verdict, riskLevel, summary, guardrails, nextAction, disagreements. Do not include markdown."
    },
    {
      role: "user",
      content: JSON.stringify(compactPayload)
    }
  ];
}

function normalizeVerdict(payload, model) {
  const normalizedPayload = unpackNestedJsonSummary(payload);

  return {
    disagreements: safeList(normalizedPayload.disagreements),
    guardrails: safeList(normalizedPayload.guardrails),
    mode: "live",
    model,
    nextAction: String(normalizedPayload.nextAction || "Continue with monitored execution."),
    riskLevel: String(normalizedPayload.riskLevel || "medium").toLowerCase(),
    summary: String(normalizedPayload.summary || "Qwen reviewed the active loop and returned a supervisor verdict."),
    verdict: String(normalizedPayload.verdict || "Qwen supervisor active")
  };
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

export function createQwenSupervisor({ env = process.env, fetchImpl = fetch } = {}) {
  const baseUrl = normalizeBaseUrl(env.QWEN_BASE_URL || env.DASHSCOPE_BASE_URL);
  const apiKey = env.DASHSCOPE_API_KEY || env.QWEN_API_KEY || "";
  const model = env.QWEN_MODEL || DEFAULT_QWEN_MODEL;

  return {
    async review(payload) {
      if (!apiKey) {
        throw new Error("DASHSCOPE_API_KEY is required for Qwen supervisor review.");
      }

      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          max_tokens: 700,
          messages: buildSupervisorMessages(payload),
          model,
          temperature: 0.2
        })
      });
      const responsePayload = await parseResponse(response);

      if (!response.ok) {
        const detail =
          typeof responsePayload === "string"
            ? responsePayload
            : responsePayload?.error?.message || responsePayload?.message || response.statusText;
        throw new Error(`Qwen supervisor failed (${response.status}): ${detail}`);
      }

      const content = responsePayload?.choices?.[0]?.message?.content;
      return normalizeVerdict(parseJsonContent(content), responsePayload?.model || model);
    }
  };
}
