import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("navigate:search-params", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("navigate:search-params", callback);
    window.removeEventListener("popstate", callback);
  };
}

function getServerSnapshot() {
  return null;
}

export default function useQueryParam(name: string) {
  return useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(name),
    getServerSnapshot
  );
}
