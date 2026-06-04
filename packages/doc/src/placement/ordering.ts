import * as Y from "yjs";
import { generateKeyBetween } from "jittered-fractional-indexing";

export interface OrderedTile {
  id: string;
  order: string;
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
      continue;
    }
    children.push({ id, order });
  }
  return children.sort((a, b) => (a.order < b.order ? -1 : 1));
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
