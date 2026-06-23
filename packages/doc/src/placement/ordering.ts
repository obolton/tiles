import * as Y from "yjs";
import { generateKeyBetween } from "jittered-fractional-indexing";

export interface OrderedTile {
  id: string;
  order: string;
}

function compareOrder(a: OrderedTile, b: OrderedTile): number {
  if (a.order < b.order) {
    return -1;
  }
  if (a.order > b.order) {
    return 1;
  }
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}

export function getChildren(
  tiles: Y.Map<Y.Map<unknown>>,
  parentId: string | null,
): OrderedTile[] {
  const children: OrderedTile[] = [];
  for (const [id, tile] of tiles) {
    if (tile.get("parentId") !== parentId) {
      continue;
    }
    const order = tile.get("order");
    if (typeof order !== "string") {
      throw new TypeError(`Invalid order for ${id}`);
    }
    children.push({ id, order });
  }
  return children.sort(compareOrder);
}

export interface OrderedEntry extends OrderedTile {
  map: Y.Map<unknown>;
}

/**
 * Returns a map's children sorted by their `order` field.
 */
export function orderedEntries(map: Y.Map<Y.Map<unknown>>): OrderedEntry[] {
  const entries: OrderedEntry[] = [];
  for (const [id, child] of map) {
    const order = child.get("order");
    if (typeof order !== "string") {
      throw new TypeError(`Invalid order for ${id}`);
    }
    entries.push({ id, order, map: child });
  }
  return entries.sort(compareOrder);
}

export function orderBetween(
  siblings: Iterable<OrderedTile>,
  beforeId?: string | null,
  skipId?: string | null,
): string {
  let prev: OrderedTile | undefined;
  let next: OrderedTile | undefined;

  for (const sibling of siblings) {
    if (sibling.id === skipId) {
      continue;
    }
    if (beforeId != null && sibling.id === beforeId) {
      next = sibling;
      break;
    }
    prev = sibling;
  }

  return generateKeyBetween(prev?.order ?? null, next?.order ?? null);
}

export function orderAfter(
  siblings: OrderedTile[],
  afterId: string | null,
): string {
  const index =
    afterId == null
      ? -1
      : siblings.findIndex((sibling) => sibling.id === afterId);
  return generateKeyBetween(
    siblings[index]?.order ?? null,
    siblings[index + 1]?.order ?? null,
  );
}
