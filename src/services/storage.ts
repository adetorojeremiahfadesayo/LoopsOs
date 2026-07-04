import { createSeedState } from "../domain/seed";
import type { AppState } from "../domain/types";

const STORAGE_KEY = "loopos.appState.v2";

export function loadAppState(): AppState {
  if (typeof window === "undefined") {
    return createSeedState();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return createSeedState();
  }

  try {
    const parsed = JSON.parse(stored) as AppState;
    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.workspaces) || !Array.isArray(parsed.loops)) {
      return createSeedState();
    }
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveAppState(state: AppState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetAppState(): AppState {
  const state = createSeedState();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}
