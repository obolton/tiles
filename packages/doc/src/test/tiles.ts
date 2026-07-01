import * as Y from "yjs";

export function getTiles(doc: Y.Doc): Record<string, unknown>[] {
  return [...doc.getMap<Y.Map<unknown>>("tiles").values()].map((tile) => tile.toJSON());
}
