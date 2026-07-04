function getHeader(request, name) {
  if (typeof request.headers?.get === "function") {
    return request.headers.get(name) || "";
  }

  const raw = request.headers?.[name.toLowerCase()];
  return Array.isArray(raw) ? raw[0] || "" : raw || "";
}

export function envFromRuntimeHeaders(request, baseEnv = process.env) {
  const env = { ...baseEnv };
  const useHostedDemo = getHeader(request, "X-LoopOS-Cognee-Use-Hosted-Demo").trim().toLowerCase() === "true";
  const baseUrl = getHeader(request, "X-LoopOS-Cognee-Base-Url").trim();
  const authMode = getHeader(request, "X-LoopOS-Cognee-Auth-Mode").trim();
  const apiKey = getHeader(request, "X-LoopOS-Cognee-Api-Key").trim();

  if (useHostedDemo) {
    if (env.LOOPOS_DEMO_COGNEE_BASE_URL) {
      env.COGNEE_BASE_URL = env.LOOPOS_DEMO_COGNEE_BASE_URL;
    }
    if (env.LOOPOS_DEMO_COGNEE_AUTH_MODE) {
      env.COGNEE_AUTH_MODE = env.LOOPOS_DEMO_COGNEE_AUTH_MODE;
    }
    if (env.LOOPOS_DEMO_COGNEE_API_KEY) {
      env.COGNEE_API_KEY = env.LOOPOS_DEMO_COGNEE_API_KEY;
    }

    return env;
  }

  if (baseUrl) {
    env.COGNEE_BASE_URL = baseUrl;
  }

  if (authMode) {
    env.COGNEE_AUTH_MODE = authMode;
  }

  if (apiKey) {
    env.COGNEE_API_KEY = apiKey;
  }

  return env;
}
