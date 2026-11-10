import { flag } from "carillon";
import type { Reactive } from "carillon";

/**
 * A reactive flag that tracks whether a media query matches. It never matches during
 * server rendering, so callers should only depend on it for client-rendered content.
 */
export function mediaQuery(query: string): Reactive<boolean> {
  if (import.meta.env.SSR || typeof matchMedia !== "function") {
    return flag(false);
  }

  const list = matchMedia(query);
  const matches = flag(list.matches);
  list.addEventListener("change", (event) => {
    matches.value = event.matches;
  });
  return matches;
}

/** Narrow viewports, below which the layout collapses to a single column. */
export const NARROW_QUERY = "(width < 640px)";
