import { useSyncExternalStore } from "react";
import { get } from "../utils/state";

function subscribe(callback: () => void) {
  window.addEventListener("state:update", callback);
  return () => {
    window.removeEventListener("state:update", callback);
  };
}

function getServerSnapshot() {
  return null;
}

export default function useSessionState(key: string) {
  return useSyncExternalStore(subscribe, () => get(key), getServerSnapshot);
}
