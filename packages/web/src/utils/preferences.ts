export function prefersReducedMotion(): boolean {
  if (import.meta.env.SSR || typeof matchMedia !== "function") {
    return false;
  }
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
