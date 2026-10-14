import * as Y from "yjs";
import { generateNKeysBetween } from "jittered-fractional-indexing";

/**
 * Creates a doc containing the given tiles, keyed by tile id. The id is written into each map
 * here because a Y.Map cannot be read until it is attached to a doc.
 */
export function createDoc(tiles: Record<string, Y.Map<unknown>>): Y.Doc {
  const doc = new Y.Doc();
  const tilesMap = doc.getMap<Y.Map<unknown>>("tiles");
  const entries = Object.entries(tiles);
  const orders = generateNKeysBetween(null, null, entries.length);
  doc.transact(() => {
    entries.forEach(([id, tile], index) => {
      tile.set("id", id);
      if (!tile.has("parentId")) {
        tile.set("parentId", null);
      }
      tile.set("order", orders[index]!);
      tilesMap.set(id, tile);
    });
  });
  return doc;
}
