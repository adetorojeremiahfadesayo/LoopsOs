import { afterEach, describe, expect, test, vi } from "vitest";
import {
  cogneeHeadersFromConnection,
  defaultCogneeConnection,
  loadCogneeConnection,
  saveCogneeConnection
} from "./cogneeConnection";

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Cognee connection settings", () => {
  test("creates sensible defaults for local open source and cloud Cognee", () => {
    expect(defaultCogneeConnection("hosted-demo")).toMatchObject({
      authMode: "backend-demo",
      baseUrl: "LoopOS hosted demo",
      kind: "hosted-demo"
    });

    expect(defaultCogneeConnection("local")).toMatchObject({
      authMode: "none",
      baseUrl: "http://127.0.0.1:8000",
      kind: "local"
    });

    expect(defaultCogneeConnection("cloud")).toMatchObject({
      authMode: "api-key",
      baseUrl: "https://api.cognee.ai",
      kind: "cloud"
    });
  });

  test("persists and reloads a user's Cognee connection choice", () => {
    const connection = {
      authMode: "api-key" as const,
      baseUrl: "https://tenant.aws.cognee.ai",
      kind: "cloud" as const,
      apiKey: "secret-key"
    };

    saveCogneeConnection(connection);

    expect(loadCogneeConnection()).toEqual(connection);
  });

  test("returns null when stored connection data is malformed", () => {
    window.localStorage.setItem("loopos.cogneeConnection.v1", JSON.stringify({ kind: "cloud" }));

    expect(loadCogneeConnection()).toBeNull();
  });

  test("maps a connection to bridge headers without sending blank secrets", () => {
    expect(
      cogneeHeadersFromConnection({
        authMode: "backend-demo",
        baseUrl: "LoopOS hosted demo",
        kind: "hosted-demo"
      })
    ).toEqual({
      "X-LoopOS-Cognee-Use-Hosted-Demo": "true"
    });

    expect(
      cogneeHeadersFromConnection({
        authMode: "none",
        baseUrl: "http://127.0.0.1:8000",
        kind: "local",
        apiKey: ""
      })
    ).toEqual({
      "X-LoopOS-Cognee-Auth-Mode": "none",
      "X-LoopOS-Cognee-Base-Url": "http://127.0.0.1:8000"
    });

    expect(
      cogneeHeadersFromConnection({
        authMode: "api-key",
        baseUrl: "https://tenant.aws.cognee.ai",
        kind: "cloud",
        apiKey: "cloud-key"
      })
    ).toEqual({
      "X-LoopOS-Cognee-Api-Key": "cloud-key",
      "X-LoopOS-Cognee-Auth-Mode": "api-key",
      "X-LoopOS-Cognee-Base-Url": "https://tenant.aws.cognee.ai"
    });
  });
});
