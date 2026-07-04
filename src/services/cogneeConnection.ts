export type CogneeConnectionKind = "hosted-demo" | "local" | "cloud";
export type CogneeConnectionAuthMode = "none" | "bearer" | "api-key" | "backend-demo";

export interface CogneeConnection {
  kind: CogneeConnectionKind;
  baseUrl: string;
  authMode: CogneeConnectionAuthMode;
  apiKey?: string;
}

const STORAGE_KEY = "loopos.cogneeConnection.v1";

export function defaultCogneeConnection(kind: CogneeConnectionKind): CogneeConnection {
  if (kind === "hosted-demo") {
    return {
      authMode: "backend-demo",
      baseUrl: "LoopOS hosted demo",
      kind
    };
  }

  if (kind === "cloud") {
    return {
      authMode: "api-key",
      baseUrl: "https://api.cognee.ai",
      kind
    };
  }

  return {
    authMode: "none",
    baseUrl: "http://127.0.0.1:8000",
    kind
  };
}

function isConnection(value: unknown): value is CogneeConnection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CogneeConnection>;
  return (
    (candidate.kind === "hosted-demo" || candidate.kind === "local" || candidate.kind === "cloud") &&
    typeof candidate.baseUrl === "string" &&
    candidate.baseUrl.trim().length > 0 &&
    (candidate.authMode === "none" ||
      candidate.authMode === "bearer" ||
      candidate.authMode === "api-key" ||
      candidate.authMode === "backend-demo")
  );
}

export function loadCogneeConnection(): CogneeConnection | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    return isConnection(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCogneeConnection(connection: CogneeConnection) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
}

export function cogneeHeadersFromConnection(connection: CogneeConnection | null): Record<string, string> {
  if (!connection) {
    return {};
  }

  if (connection.kind === "hosted-demo") {
    return {
      "X-LoopOS-Cognee-Use-Hosted-Demo": "true"
    };
  }

  const headers: Record<string, string> = {
    "X-LoopOS-Cognee-Auth-Mode": connection.authMode,
    "X-LoopOS-Cognee-Base-Url": connection.baseUrl
  };

  if (connection.apiKey?.trim()) {
    headers["X-LoopOS-Cognee-Api-Key"] = connection.apiKey.trim();
  }

  return headers;
}
