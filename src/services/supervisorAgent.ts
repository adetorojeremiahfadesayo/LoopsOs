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

    return (await response.json()) as SupervisorAgentVerdict;
  } catch {
    return null;
  }
}
