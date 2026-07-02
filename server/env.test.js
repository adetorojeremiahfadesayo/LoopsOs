// @vitest-environment node
import { describe, expect, test } from "vitest";
import { parseDotEnv } from "./env.js";

describe("env loader", () => {
  test("parses comments, quoted values, and plain key-value pairs", () => {
    expect(
      parseDotEnv(`
        # LoopOS config
        LOOPOS_API_PORT=8787
        COGNEE_BASE_URL="https://api.cognee.ai"
        COGNEE_AUTH_MODE=api-key
      `)
    ).toEqual({
      COGNEE_AUTH_MODE: "api-key",
      COGNEE_BASE_URL: "https://api.cognee.ai",
      LOOPOS_API_PORT: "8787"
    });
  });
});
