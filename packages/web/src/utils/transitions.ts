import { prefersReducedMotion } from "@/utils/preferences";

export function viewTransition(callback: () => void): ViewTransition {
  if (typeof document.startViewTransition !== "undefined" && !prefersReducedMotion()) {
    return document.startViewTransition(callback);
  }

  queueMicrotask(callback);

  return {
    updateCallbackDone: Promise.resolve(undefined),
    ready: Promise.resolve(undefined),
    finished: Promise.resolve(undefined),
    skipTransition: () => {},
    types: new Set(),
  };
}
