export type PanelEdge = "top" | "bottom" | "left" | "right";

/**
 * The axis a panel resizes along for a given edge.
 */
export function panelAxis(edge: PanelEdge): "x" | "y" {
  return edge === "top" || edge === "bottom" ? "y" : "x";
}

/**
 * The direction a positive drag delta grows the panel.
 */
export function panelSign(edge: PanelEdge): 1 | -1 {
  return edge === "right" || edge === "bottom" ? -1 : 1;
}

export function clampSize(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Resolve the clamped panel size from the size at the start of a resize and the
 * pointer/keyboard delta, accounting for the panel's edge.
 */
export function resolveSize(
  edge: PanelEdge,
  startSize: number,
  deltaX: number,
  deltaY: number,
  min: number,
  max: number,
): number {
  const delta = panelAxis(edge) === "y" ? deltaY : deltaX;
  return clampSize(startSize + delta * panelSign(edge), min, max);
}

export function isPanelEdge(value: string | null): value is PanelEdge {
  return value === "top" || value === "bottom" || value === "left" || value === "right";
}
