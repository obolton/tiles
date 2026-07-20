export type PhysicalEdge = "top" | "bottom" | "left" | "right";
export type LogicalEdge = "inline-start" | "inline-end";
export type PanelEdge = PhysicalEdge | LogicalEdge;

/**
 * Resolve an edge to a physical edge for a writing direction.
 * Placement is handled in CSS via logical properties; this is only needed to
 * map physical pointer/keyboard deltas onto the panel's grow direction.
 */
export function resolvePhysicalEdge(edge: PanelEdge, direction: "ltr" | "rtl"): PhysicalEdge {
  if (edge === "inline-start") {
    return direction === "rtl" ? "right" : "left";
  }
  if (edge === "inline-end") {
    return direction === "rtl" ? "left" : "right";
  }
  return edge;
}

/**
 * The axis a panel resizes along for a given edge.
 */
export function panelAxis(edge: PhysicalEdge): "x" | "y" {
  return edge === "top" || edge === "bottom" ? "y" : "x";
}

/**
 * The direction a positive drag delta grows the panel.
 */
export function panelSign(edge: PhysicalEdge): 1 | -1 {
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
  edge: PhysicalEdge,
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
  return (
    value === "top" ||
    value === "bottom" ||
    value === "left" ||
    value === "right" ||
    value === "inline-start" ||
    value === "inline-end"
  );
}
