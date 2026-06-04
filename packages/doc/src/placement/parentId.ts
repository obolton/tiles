import type { DockEdge } from "../types/enums.ts";

/**
 * A tile's placement parent is encoded as a single string:
 *
 * - `null` — the page root
 * - `dock:<EDGE>` — a dock zone (e.g. `dock:TOP`)
 * - `<uuid>` — a section tile
 */

export const DOCK_PARENT_PREFIX = "dock:";

const DOCK_EDGES = new Set<DockEdge>(["TOP", "LEFT", "RIGHT", "BOTTOM"]);

function isDockEdge(value: string): value is DockEdge {
  return DOCK_EDGES.has(value as DockEdge);
}

export type TileParent =
  | { type: "root" }
  | { type: "dock"; edge: DockEdge }
  | { type: "section"; sectionId: string };

/**
 * Classifies a parentId into the page root, a dock zone, or a section.
 *
 * An unrecognised dock edge falls back to {@link type} `root` so a tile with
 * a malformed parent is never silently treated as a section.
 */
export function parseParentId(parentId: string | null): TileParent {
  if (parentId === null) {
    return { type: "root" };
  }

  if (parentId.startsWith(DOCK_PARENT_PREFIX)) {
    const edge = parentId.slice(DOCK_PARENT_PREFIX.length);
    return isDockEdge(edge) ? { type: "dock", edge } : { type: "root" };
  }

  return { type: "section", sectionId: parentId };
}

/**
 * Builds the parentId for a dock zone edge. Section parents are the section's
 * own id, and the page root is `null`, so neither needs a constructor.
 */
export function dockParentId(edge: DockEdge): string {
  return `${DOCK_PARENT_PREFIX}${edge}`;
}

/**
 * Translates the server's separate `sectionId`/`dock` axes into a single
 * parentId. A dock assignment takes precedence over a section.
 */
export function toParentId(
  sectionId: string | null,
  dock: DockEdge | null,
): string | null {
  if (dock !== null) {
    return dockParentId(dock);
  }
  return sectionId;
}
