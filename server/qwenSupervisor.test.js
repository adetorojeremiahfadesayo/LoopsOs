// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { createQwenSupervisor } from "./qwenSupervisor.js";

const payload = {
  auditEvents: [{ action: "loop.edited", targetName: "LOOP.md" }],
  latestLoop: {
    goal: "Ship a safer agent workflow.",
    memoryRules: ["Recall project constraints first."],
    name: "Web Builder Loop",
    validationChecks: ["Run tests before handoff."]
  },
  memorySources: [{ ingestionStatus: "ingested", title: "Project Rules" }],
  runs: [{ outcomeNotes: "Needs stronger approval gate." }]
};

describe("Qwen supervisor", () => {
  test("returns a structured live verdict from Qwen chat completions", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  verdict: "Monitor with approval gate",
                  riskLevel: "medium",
                  summary: "Qwen sees enough loop evidence to supervise the workflow.",
                  guardrails: ["Require approval before deployment"],
                  nextAction: "Start monitored run",
                  disagreements: ["No Claude log attached yet"]
                })
              }
            }
          ],
          model: "qwen-plus"
        }),
        { status: 200 }
      )
    );
    const supervisor = createQwenSupervisor({
      env: {
        DASHSCOPE_API_KEY: "test-key",
        QWEN_BASE_URL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        QWEN_MODEL: "qwen-plus"
      },
      fetchImpl
    });

    const result = await supervisor.review(payload);

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" })
      })
    );
    expect(result).toEqual({
      disagreements: ["No Claude log attached yet"],
      guardrails: ["Require approval before deployment"],
      mode: "live",
      model: "qwen-plus",
      nextAction: "Start monitored run",
      riskLevel: "medium",
      summary: "Qwen sees enough loop evidence to supervise the workflow.",
      verdict: "Monitor with approval gate"
    });
  });

  test("extracts verdict fields when Qwen wraps JSON with extra text", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: `Here is the supervisor verdict:\n${JSON.stringify({
                  verdict: "caution",
                  riskLevel: "medium",
                  summary: "The loop is missing visible memory grounding.",
                  guardrails: ["Confirm memory ingestion before execution"],
                  nextAction: "Pause until memory is visible.",
                  disagreements: ["No Claude Code log attached"]
                })}`
              }
            }
          ],
          model: "qwen-plus"
        }),
        { status: 200 }
      )
    );
    const supervisor = createQwenSupervisor({
      env: {
        DASHSCOPE_API_KEY: "test-key",
        QWEN_BASE_URL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        QWEN_MODEL: "qwen-plus"
      },
      fetchImpl
    });

    await expect(supervisor.review(payload)).resolves.toMatchObject({
      guardrails: ["Confirm memory ingestion before execution"],
      nextAction: "Pause until memory is visible.",
      riskLevel: "medium",
      summary: "The loop is missing visible memory grounding.",
      verdict: "caution"
    });
  });
});
