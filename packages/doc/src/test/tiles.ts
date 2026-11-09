import * as Y from "yjs";

export function getTiles(doc: Y.Doc): Record<string, unknown>[] {
  return [...doc.getMap<Y.Map<unknown>>("tiles").values()].map((tile) => tile.toJSON());
}

/** Adds a tile map to the tiles map with its id and placement. */
export function placeTile(
  tiles: Y.Map<Y.Map<unknown>>,
  id: string,
  tile: Y.Map<unknown>,
  parentId: string | null = null,
  order = "a0",
): Y.Map<unknown> {
  tile.set("id", id);
  tile.set("parentId", parentId);
  tile.set("order", order);
  tiles.set(id, tile);
  return tile;
}

/** Appends a paragraph of plain text to a rich text fragment. */
export function appendParagraph(fragment: Y.XmlFragment, text: string): void {
  const paragraph = new Y.XmlElement("paragraph");
  const content = new Y.XmlText();
  content.insert(0, text);
  paragraph.insert(0, [content]);
  fragment.insert(fragment.length, [paragraph]);
}

/** Appends a paragraph of plain text to a text tile's content. */
export function writeText(tile: Y.Map<unknown>, text: string): void {
  const content = tile.get("content");
  if (!(content instanceof Y.XmlFragment)) {
    throw new Error("Expected a content fragment");
  }
  appendParagraph(content, text);
}
