import * as Y from "yjs";
import { orderBetween } from "doc/placement/ordering";
import TileCollection from "./TileCollection";
import { parseParentId } from "./parentId";
import type Page from "./Page";
import type Tile from "./Tile";

/** Tile Y.Map keys that affect placement. Other field writes are ignored. */
const PLACEMENT_KEYS = ["parentId", "order"];

export type TileRemovalCallback = (ids: ReadonlySet<string>) => void;

/**
 * Owns the per-parent {@link TileCollection}s and keeps them in sync with the
 * Y.Doc `tiles` map. The Y.Doc is the source of truth for placement
 * (`parentId` + `order`); each collection is an incrementally-maintained,
 * order-sorted view of it.
 */
export default class TilePlacement {
  private readonly page: Page;
  private readonly onTilesRemoved?: TileRemovalCallback;

  /** Lazily-materialised collections, keyed by parentId (`null` = page root). */
  private readonly collections = new Map<string | null, TileCollection>();

  private tilesMap: Y.Map<Y.Map<unknown>> | null = null;
  private readonly onChange = this.reconcile.bind(this);

  constructor(page: Page, onTilesRemoved?: TileRemovalCallback) {
    this.page = page;
    this.onTilesRemoved = onTilesRemoved;
    const tiles = page.doc.getMap<Y.Map<unknown>>("tiles");
    // Index every tile before placing any, so a child's section is in the
    // index regardless of the order of the map map.
    const created: Tile[] = [];
    for (const data of tiles.values()) {
      created.push(page.add(data));
    }
    for (const tile of created) {
      this.place(tile);
    }
    this.tilesMap = tiles;
    this.tilesMap.observeDeep(this.onChange);
  }

  /**
   * Returns the collection for a parentId, creating it on first access.
   */
  getCollection(parentId: string | null): TileCollection {
    let collection = this.collections.get(parentId);
    if (!collection) {
      collection = new TileCollection();
      this.collections.set(parentId, collection);
    }
    return collection;
  }

  /**
   * The fractional order key positioning a tile before `beforeId` (or last
   * when null/missing) within `parentId`'s collection. Pass `skip` to exclude
   * a tile from comparison (e.g. when repositioning a tile within its current
   * collection).
   */
  orderBefore(parentId: string | null, beforeId: string | null | undefined, skip?: Tile): string {
    const siblings = this.getCollection(parentId)
      .value.values()
      .map((tile) => ({ id: tile.id, order: tile.order.value }));
    return orderBetween(siblings, beforeId, skip?.id);
  }

  /** Removes a tile from its collection and the page index. Idempotent. */
  remove(id: string) {
    const tile = this.page.index.get(id);
    if (!tile) {
      return;
    }
    tile.parent?.remove(tile);
    this.page.remove(id);
  }

  /**
   * Inserts (or repositions) a tile in the collection for its current
   * `parentId`, ordered by its fractional `order`. Orphans — a `parentId` that
   * resolves to a section which does not exist — are not rendered: any
   * existing placement is dropped and the tile is left in no collection.
   */
  private place(tile: Tile) {
    const parentId = tile.parentId.value;
    const parent = parseParentId(parentId);

    if (parent.type === "section" && !this.page.index.has(parent.sectionId)) {
      tile.parent?.remove(tile);
      if (import.meta.env.DEV) {
        console.warn(`Tile ${tile.id} references missing parent ${parent.sectionId}; not rendered`);
      }
      return;
    }

    const collection = this.getCollection(parentId);
    collection.insertBefore(this.beforeIdFor(collection, tile), tile);
  }

  /**
   * The id of the first tile in the collection that should sort after `tile`,
   * or `null` to append. Linear scan — collections are small and the
   * optimisation is deferred to a library-level change (see plan).
   */
  private beforeIdFor(collection: TileCollection, tile: Tile): string | null {
    const order = tile.order.value;
    for (const item of collection.value) {
      if (item !== tile && item.order.value > order) {
        return item.id;
      }
    }
    return null;
  }

  private reconcile(events: Y.YEvent<Y.AbstractType<unknown>>[]) {
    const added = new Set<string>();
    const removed = new Set<string>();
    const moved = new Set<string>();

    for (const event of events) {
      if (event.target === this.tilesMap) {
        for (const [id, change] of event.changes.keys) {
          if (change.action === "add") {
            added.add(id);
          } else if (change.action === "delete") {
            removed.add(id);
          }
        }
      } else if (event instanceof Y.YMapEvent) {
        // A nested tile map changed. Only parentId/order affect placement;
        // x/y/style writes are ignored so they don't fight other writers.
        const id = event.path[0];
        if (typeof id === "string" && PLACEMENT_KEYS.some((key) => event.keysChanged.has(key))) {
          moved.add(id);
        }
      }
    }

    for (const id of removed) {
      this.remove(id);
    }

    const tilesToPlace: Tile[] = [];
    for (const id of added) {
      const data = this.tilesMap?.get(id);
      if (data) {
        tilesToPlace.push(this.page.add(data));
      }
    }

    for (const tile of tilesToPlace) {
      this.place(tile);
    }

    for (const id of moved) {
      if (added.has(id) || removed.has(id)) {
        continue;
      }
      const tile = this.page.index.get(id);
      if (tile) {
        this.place(tile);
      }
    }

    if (removed.size > 0 && this.onTilesRemoved) {
      this.page.doc.once("afterTransaction", () => this.onTilesRemoved?.(removed));
    }
  }

  dispose() {
    this.tilesMap?.unobserveDeep(this.onChange);
    this.tilesMap = null;
    this.collections.clear();
  }
}
