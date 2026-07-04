// @vitest-environment node
import { describe, expect, test } from "vitest";
import { envFromRuntimeHeaders } from "./runtimeConfig.js";

describe("runtime Cognee config", () => {
  test("overrides Cognee env values from LoopOS request headers", () => {
    const request = new Request("http://127.0.0.1/api/cognee/status", {
      headers: {
        "X-LoopOS-Cognee-Api-Key": "cloud-key",
        "X-LoopOS-Cognee-Auth-Mode": "api-key",
        "X-LoopOS-Cognee-Base-Url": "https://tenant.aws.cognee.ai"
      }
    });

    expect(envFromRuntimeHeaders(request, { COGNEE_BASE_URL: "http://127.0.0.1:8000" })).toEqual({
      COGNEE_API_KEY: "cloud-key",
      COGNEE_AUTH_MODE: "api-key",
      COGNEE_BASE_URL: "https://tenant.aws.cognee.ai"
    });
  });

  test("keeps existing env values when headers are absent", () => {
    const env = {
      COGNEE_API_KEY: "existing-key",
      COGNEE_AUTH_MODE: "bearer",
      COGNEE_BASE_URL: "http://127.0.0.1:8000"
    };

    expect(envFromRuntimeHeaders(new Request("http://127.0.0.1/api/cognee/status"), env)).toEqual(env);
  });

  test("uses backend-only hosted demo Cognee credentials when requested", () => {
    const request = new Request("http://127.0.0.1/api/cognee/status", {
      headers: {
        "X-LoopOS-Cognee-Use-Hosted-Demo": "true"
      }
    });

    expect(
      envFromRuntimeHeaders(request, {
        COGNEE_BASE_URL: "http://127.0.0.1:8000",
        LOOPOS_DEMO_COGNEE_API_KEY: "private-demo-key",
        LOOPOS_DEMO_COGNEE_AUTH_MODE: "api-key",
        LOOPOS_DEMO_COGNEE_BASE_URL: "https://loopos-demo.aws.cognee.ai"
      })
    ).toEqual({
      COGNEE_API_KEY: "private-demo-key",
      COGNEE_AUTH_MODE: "api-key",
      COGNEE_BASE_URL: "https://loopos-demo.aws.cognee.ai",
      LOOPOS_DEMO_COGNEE_API_KEY: "private-demo-key",
      LOOPOS_DEMO_COGNEE_AUTH_MODE: "api-key",
      LOOPOS_DEMO_COGNEE_BASE_URL: "https://loopos-demo.aws.cognee.ai"
    });
  });
});
