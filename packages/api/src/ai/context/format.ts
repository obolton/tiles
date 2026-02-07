import { extractContent } from "./extractors";
import type { ClientTile } from "@/types/tiles";

/**
 * Generate a context ID for a tile at the given index.
 */
export function getContextId(tile: ClientTile, index: number): string {
  return `${tile.type.toLowerCase()}-${index}`;
}

/**
 * Build a map from context IDs to tile IDs.
 */
export function buildContextIdMap(tiles: ClientTile[]): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]!;
    map.set(getContextId(tile, i), tile.id);
  }
  return map;
}

/**
 * Format tiles as context for an LLM, including reference IDs for editing.
 */
export function formatTileContext(tiles: ClientTile[]): string {
  const sections: string[] = [];

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]!;
    const contextId = getContextId(tile, i);
    const content = extractContent(tile);
    sections.push(
      content
        ? `[${contextId}] (${tile.type})\n${content}`
        : `[${contextId}] (${tile.type}, empty)`,
    );
  }

  if (sections.length === 0) {
    return "";
  }

  return `The following content is referenced from the document. You can edit these using their IDs:\n\n${sections.join("\n\n---\n\n")}`;
}
