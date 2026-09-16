import { useSyncExternalStore } from "react";
import { getState, subscribe } from "./store";
import type { AppState } from "./types";

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}
