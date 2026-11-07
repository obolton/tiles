import * as Y from "yjs";

/** The rich text block that embeds a tile by id. */
export const TILE_NODE = "tile";

type Child = Y.XmlElement | Y.XmlText | Y.XmlHook;

interface Slot {
  parent: Y.XmlFragment;
  index: number;
}

export function createTileElement(id: string): Y.XmlElement {
  const element = new Y.XmlElement(TILE_NODE);
  element.setAttribute("id", id);
  return element;
}

function isTile(node: unknown): node is Y.XmlElement {
  return node instanceof Y.XmlElement && node.nodeName === TILE_NODE;
}

function tileId(element: Y.XmlElement): string | null {
  const id = element.getAttribute("id");
  return typeof id === "string" ? id : null;
}

function tileElements(fragment: Y.XmlFragment): Y.XmlElement[] {
  return fragment.querySelectorAll(TILE_NODE).filter(isTile);
}

function parentOf(node: Child): Y.XmlFragment | null {
  const parent: unknown = node.parent;
  return parent instanceof Y.XmlFragment ? parent : null;
}

function indexOf(parent: Y.XmlFragment, child: Child): number {
  return parent.toArray().indexOf(child);
}

/** Ids of the tiles embedded anywhere in the fragment, in document order. */
export function getTileIds(fragment: Y.XmlFragment): string[] {
  return tileElements(fragment).flatMap((element) => tileId(element) ?? []);
}

/** Walks the fragment up to the first tile element with the id. */
export function findTile(fragment: Y.XmlFragment, id: string): Y.XmlElement | null {
  const walker = fragment.createTreeWalker((node) => isTile(node) && tileId(node) === id);
  const { value } = walker.next();
  return isTile(value) ? value : null;
}

function resolve(fragment: Y.XmlFragment, at: Y.RelativePosition): Y.AbsolutePosition | null {
  return fragment.doc && Y.createAbsolutePositionFromRelativePosition(at, fragment.doc);
}

/** Resolves a position between the children of the fragment or of one of its elements. */
function resolveSlot(fragment: Y.XmlFragment, at: Y.RelativePosition): Slot | null {
  const position = resolve(fragment, at);
  if (!position || !(position.type instanceof Y.XmlFragment)) {
    return null;
  }
  return { parent: position.type, index: position.index };
}

/**
 * Inserts a tile element at `at`, a position between blocks, or appends it. A tile that ends the
 * fragment is followed by an empty paragraph so there is a line to continue on.
 */
export function insertTile(fragment: Y.XmlFragment, id: string, at?: Y.RelativePosition): void {
  const { parent, index } = (at && resolveSlot(fragment, at)) || {
    parent: fragment,
    index: fragment.length,
  };
  const content: Y.XmlElement[] = [createTileElement(id)];
  if (parent === fragment && index === fragment.length) {
    content.push(new Y.XmlElement("paragraph"));
  }
  parent.insert(index, content);
}

/** The position after the top-level block containing `at`, for embedding tiles from a caret. */
export function positionAfterBlock(
  fragment: Y.XmlFragment,
  at: Y.RelativePosition,
): Y.RelativePosition | null {
  const position = resolve(fragment, at);
  if (!position) {
    return null;
  }
  let block: Y.AbstractType<unknown> = position.type;
  if (block === fragment) {
    return Y.createRelativePositionFromTypeIndex(fragment, position.index);
  }
  while (block.parent && block.parent !== fragment) {
    block = block.parent;
  }
  const index = fragment.toArray().findIndex((child) => child === block);
  return index === -1 ? null : Y.createRelativePositionFromTypeIndex(fragment, index + 1);
}

/** The position directly after an embedded tile, for inserting the next one. */
export function positionAfterTile(fragment: Y.XmlFragment, id: string): Y.RelativePosition | null {
  const element = findTile(fragment, id);
  const parent = element && parentOf(element);
  if (!element || !parent) {
    return null;
  }
  return Y.createRelativePositionFromTypeIndex(parent, indexOf(parent, element) + 1);
}

export function removeTiles(fragment: Y.XmlFragment, ids: Iterable<string>): void {
  const targets = new Set(ids);
  for (const element of tileElements(fragment)) {
    const parent = parentOf(element);
    const id = tileId(element);
    if (parent && id !== null && targets.has(id)) {
      parent.delete(indexOf(parent, element), 1);
    }
  }
}
