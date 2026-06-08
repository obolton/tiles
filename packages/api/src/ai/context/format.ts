import type { TileContent } from "@/ai/tileContent";

/**
 * Build an array mapping context indices to tile IDs.
 */
export function buildContextIds(tiles: TileContent[]): string[] {
  return tiles.map((tile) => tile.id);
}

/**
 * Format tiles as context for an LLM, including reference IDs for editing.
 */
export function formatTileContext(tiles: TileContent[]): string {
  if (tiles.length === 0) {
    return "";
  }

  const sections = tiles.map((tile, i) =>
    tile.content
      ? `[${i}] (${tile.type})\n${tile.content}`
      : `[${i}] (${tile.type}, empty)`,
  );

  return `The following content is referenced from the document. You can edit these using their IDs:\n\n${sections.join("\n\n---\n\n")}`;
}
