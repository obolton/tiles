import * as Y from "yjs";

/** The rich text block that embeds a tile by id. */
export const TILE_NODE = "tile";

/** Elements whose children may include embedded tiles, besides the fragment itself. */
const TILE_PARENTS = new Set(["list_item", "quote", "pending"]);

type Parent = Y.XmlFragment | Y.XmlElement;
type Child = Y.XmlElement | Y.XmlText;

export function createTileElement(id: string): Y.XmlElement {
  const element = new Y.XmlElement(TILE_NODE);
  element.setAttribute("id", id);
  return element;
}

function tileElements(fragment: Y.XmlFragment): Y.XmlElement[] {
  return fragment
    .querySelectorAll(TILE_NODE)
    .filter((element): element is Y.XmlElement => element instanceof Y.XmlElement);
}

function tileId(element: Y.XmlElement): string | null {
  const id = element.getAttribute("id");
  return typeof id === "string" ? id : null;
}

/** Ids of the tiles embedded anywhere in the fragment, in document order. */
export function getTileIds(fragment: Y.XmlFragment): string[] {
  return tileElements(fragment).flatMap((element) => tileId(element) ?? []);
}

export function findTile(fragment: Y.XmlFragment, id: string): Y.XmlElement | null {
  return tileElements(fragment).find((element) => tileId(element) === id) ?? null;
}

// Y.XmlElement extends Y.XmlFragment, so elements are checked first.
function acceptsTiles(node: unknown): node is Parent {
  if (node instanceof Y.XmlElement) {
    return TILE_PARENTS.has(node.nodeName);
  }
  return node instanceof Y.XmlFragment;
}

function asChild(value: unknown): Child | null {
  return value instanceof Y.XmlElement || value instanceof Y.XmlText ? value : null;
}

function parentOf(node: Child): Parent | null {
  const parent: unknown = node.parent;
  return parent instanceof Y.XmlFragment ? parent : null;
}

function indexOf(parent: Parent, child: Child): number {
  return parent.toArray().indexOf(child);
}

function minIndex(parent: Parent): number {
  // A list item must start with its paragraph.
  return parent instanceof Y.XmlElement && parent.nodeName === "list_item" ? 1 : 0;
}

interface InsertionPoint {
  parent: Parent;
  index: number;
}

/**
 * Resolves a relative position to the slot after the block that contains it, in the nearest
 * ancestor that accepts tiles. A position directly between the children of such an ancestor is
 * used as is.
 */
function resolveInsertionPoint(
  fragment: Y.XmlFragment,
  at: Y.RelativePosition,
): InsertionPoint | null {
  if (!fragment.doc) {
    return null;
  }
  const position = Y.createAbsolutePositionFromRelativePosition(at, fragment.doc);
  if (!position) {
    return null;
  }

  const { type, index } = position;
  if (acceptsTiles(type)) {
    return { parent: type, index: Math.max(index, minIndex(type)) };
  }

  let block = asChild(type);
  if (!block) {
    return null;
  }
  let parent = parentOf(block);
  while (parent && !acceptsTiles(parent)) {
    block = parent;
    parent = parentOf(block);
  }
  if (!parent) {
    return null;
  }
  return { parent, index: indexOf(parent, block) + 1 };
}

/**
 * Inserts a tile element after the block containing `at`, or appends it to the fragment. A
 * tile that ends the fragment is followed by an empty paragraph so there is a line to continue on.
 */
export function insertTile(fragment: Y.XmlFragment, id: string, at?: Y.RelativePosition): void {
  const point = (at && resolveInsertionPoint(fragment, at)) || {
    parent: fragment,
    index: fragment.length,
  };
  const { parent, index } = point;
  const content: Y.XmlElement[] = [createTileElement(id)];
  if (parent === fragment && index === fragment.length) {
    content.push(new Y.XmlElement("paragraph"));
  }
  parent.insert(index, content);
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
  const elements = tileElements(fragment).filter((element) => {
    const id = tileId(element);
    return id !== null && targets.has(id);
  });
  for (const element of elements) {
    const parent = parentOf(element);
    parent?.delete(indexOf(parent, element), 1);
  }
}

/**
 * Moves an embedded tile by `offset` positions among its siblings. The element is re-created at
 * the new index since Yjs cannot move items.
 */
export function moveTile(fragment: Y.XmlFragment, id: string, offset: number): void {
  const element = findTile(fragment, id);
  const parent = element && parentOf(element);
  if (!element || !parent) {
    return;
  }
  const index = indexOf(parent, element);
  const target = index + offset;
  if (target < minIndex(parent) || target >= parent.length) {
    return;
  }
  const move = () => {
    parent.delete(index, 1);
    parent.insert(target, [createTileElement(id)]);
  };
  if (fragment.doc) {
    fragment.doc.transact(move);
  } else {
    move();
  }
}
