import { extractContent } from "./extractors";
import type { ClientTile } from "@/types/tiles";

/**
 * Format tiles as context for an LLM.
 */
export function formatTileContext(tiles: ClientTile[]): string {
  const sections: string[] = [];

  for (const tile of tiles) {
    const content = extractContent(tile);
    if (content) {
      sections.push(content);
    }
  }

  if (sections.length === 0) {
    return "";
  }

  return `The following content is selected in the document for context:\n\n${sections.join("\n\n---\n\n")}`;
}
