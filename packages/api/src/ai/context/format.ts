import { extractContent } from "./extractors";
import type { ClientTile } from "@/types/tiles";

/**
 * Build an array mapping context indices to tile IDs.
 */
export function buildContextIds(tiles: ClientTile[]): string[] {
  return tiles.map((tile) => tile.id);
}

/**
 * Format tiles as context for an LLM, including reference IDs for editing.
 */
export function formatTileContext(tiles: ClientTile[]): string {
  const sections: string[] = [];

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]!;
    const content = extractContent(tile);
    sections.push(
      content
        ? `[${i}] (${tile.type})\n${content}`
        : `[${i}] (${tile.type}, empty)`,
    );
  }

  if (sections.length === 0) {
    return "";
  }

  return `The following content is referenced from the document. You can edit these using their IDs:\n\n${sections.join("\n\n---\n\n")}`;
}
