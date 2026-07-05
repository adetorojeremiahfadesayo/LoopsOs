import type { AuditEvent, LoopPlaybook, MemorySource, RunRecord } from "../domain/types";

export interface SupervisorAgentVerdict {
  disagreements: string[];
  guardrails: string[];
  mode: "live";
  model: string;
  nextAction: string;
  riskLevel: string;
  summary: string;
  verdict: string;
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : value;
  const objectStart = candidate.indexOf("{");
  const objectEnd = candidate.lastIndexOf("}");
  const rawObject = objectStart >= 0 && objectEnd > objectStart ? candidate.slice(objectStart, objectEnd + 1) : candidate;

  try {
    const parsed = JSON.parse(rawObject);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function textValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function normalizeSupervisorVerdict(payload: unknown): SupervisorAgentVerdict {
  const responseObject = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
  const nestedSummary = parseJsonObject(responseObject.summary);
  const source = nestedSummary ? { ...responseObject, ...nestedSummary } : responseObject;

  return {
    disagreements: stringList(source.disagreements),
    guardrails: stringList(source.guardrails),
    mode: "live",
    model: textValue(source.model, "live model"),
    nextAction: textValue(source.nextAction, "Continue with monitored execution."),
    riskLevel: textValue(source.riskLevel, "medium").toLowerCase(),
    summary: textValue(source.summary, "The supervisor agent reviewed the active loop and returned a verdict."),
    verdict: textValue(source.verdict, "Supervisor agent active")
  };
}

export async function reviewSupervisorLoop(input: {
  auditEvents: AuditEvent[];
  latestLoop: LoopPlaybook | undefined;
  memorySources: MemorySource[];
  runs: RunRecord[];
}): Promise<SupervisorAgentVerdict | null> {
  try {
    const response = await fetch("/api/agent/supervisor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      return null;
    }

    return normalizeSupervisorVerdict(await response.json());
  } catch {
    return null;
  }
}
