export function viewTransition(callback: () => void): ViewTransition {
  if (typeof document.startViewTransition !== "undefined") {
    return document.startViewTransition(callback);
  }

  // Perform the transition immediately in browsers that do not support the View Transitions API
  callback();

  return {
    updateCallbackDone: Promise.resolve(undefined),
    ready: Promise.resolve(undefined),
    finished: Promise.resolve(undefined),
    skipTransition: () => {},
  };
}
