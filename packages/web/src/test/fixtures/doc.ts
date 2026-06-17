import * as Y from "yjs";
import { generateNKeysBetween } from "jittered-fractional-indexing";

export function createDoc(tiles: Y.Map<unknown>[]): Y.Doc {
  const doc = new Y.Doc();
  const tilesMap = doc.getMap<Y.Map<unknown>>("tiles");
  const orders = generateNKeysBetween(null, null, tiles.length);
  tiles.forEach((tile, index) => {
    const id = tile.get("id");
    if (typeof id !== "string") {
      throw new Error("Tile map is missing an id");
    }
    if (!tile.has("parentId")) {
      tile.set("parentId", null);
    }
    tile.set("order", orders[index]!);
    tilesMap.set(id, tile);
  });
  return doc;
}
