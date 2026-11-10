import type * as Y from "yjs";
import { BODY_ID } from "doc/body";
import { getChildren } from "doc/placement/ordering";
import { fragmentToMarkdown } from "doc/markdown/richText";
import { tileToMarkdown } from "doc/markdown/tiles";
import { getTileIds } from "doc/richText/tiles";
import type { TileType } from "doc/types/enums";

export interface TileContent {
  id: string;
  type: TileType;
  content: string;
}

/**
 * Resolves tile IDs to their content from a Y.Doc. Sections expand to their children and
 * {@link BODY_ID} to the document body, whose embedded tiles are inlined with their own IDs.
 */
export function resolveTileContents(
  doc: Y.Doc,
  ids: string[],
  body: Y.XmlFragment | null = null,
): TileContent[] {
  const tiles = doc.getMap<Y.Map<unknown>>("tiles");
  const resolved = expandReferences(tiles, ids, body);
  const refs = new Map(resolved.map((id, index) => [id, index]));

  const describe = (id: string): string => {
    const tile = tiles.get(id);
    if (!tile) {
      return "";
    }
    if (tile.get("type") === "SECTION") {
      return getChildren(tiles, id)
        .map((child) => describe(child.id))
        .filter((content) => content.length > 0)
        .join("\n\n");
    }
    const content = tileToMarkdown(tile, { tiles });
    const header = `[${refs.get(id)}] (${String(tile.get("type"))}${content ? "" : ", empty"})`;
    return content ? `${header}\n${content}` : header;
  };

  return resolved.map((id) => {
    if (id === BODY_ID) {
      return {
        id,
        type: "TEXT",
        content: body ? fragmentToMarkdown(body, { tile: describe }) : "",
      };
    }
    const tile = tiles.get(id);
    const type = tile?.get("type") as TileType;
    return { id, type, content: tile ? tileToMarkdown(tile, { tiles }) : "" };
  });
}

/** Content tile ids in order: the body before its embedded tiles, sections as their children. */
function expandReferences(
  tiles: Y.Map<Y.Map<unknown>>,
  ids: string[],
  body: Y.XmlFragment | null,
): string[] {
  const resolved = new Set<string>();
  const visit = (id: string) => {
    if (id === BODY_ID) {
      if (body) {
        resolved.add(id);
        getTileIds(body).forEach(visit);
      }
      return;
    }
    const tile = tiles.get(id);
    if (!tile) {
      return;
    }
    if (tile.get("type") === "SECTION") {
      for (const child of getChildren(tiles, id)) {
        visit(child.id);
      }
    } else {
      resolved.add(id);
    }
  };
  ids.forEach(visit);
  return Array.from(resolved);
}
