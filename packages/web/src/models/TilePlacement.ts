import * as Y from "yjs";
import TileCollection from "./TileCollection";
import createTile from "./createTile";
import { parseParentId } from "./parentId";
import type Page from "./Page";
import type Tile from "./Tile";
import type { ClientTile } from "api/types/tiles";

/**
 * Owns the per-parent {@link TileCollection}s and keeps them in sync with the
 * Y.Doc `tiles` map. The Y.Doc is the source of truth for placement
 * (`parentId` + `order`); each collection is an incrementally-maintained,
 * order-sorted view of it.
 *
 * The controller is inert until {@link bootstrap} is called: it attaches its
 * Y.Doc observer there, so nothing reconciles while the legacy
 * `Page.initTiles` path is still in use.
 */
export default class TilePlacement {
  private readonly page: Page;

  /** Lazily-materialised collections, keyed by parentId (`null` = page root). */
  private readonly collections = new Map<string | null, TileCollection>();

  private tilesMap: Y.Map<Y.Map<unknown>> | null = null;
  private readonly onChange = this.reconcile.bind(this);

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Returns the collection for a parentId, creating it on first access. Dock
   * and root collections carry a `null` sectionId; section collections carry
   * their section id (preserving the existing `TileCollection.sectionId`
   * contract).
   */
  getCollection(parentId: string | null): TileCollection {
    let collection = this.collections.get(parentId);
    if (!collection) {
      const parent = parseParentId(parentId);
      collection = new TileCollection(
        parent.type === "section" ? parent.sectionId : null,
      );
      this.collections.set(parentId, collection);
    }
    return collection;
  }

  /**
   * Constructs the tile models and places them into collections. The full set
   * of tiles and their type-specific data is still server-owned this phase, so
   * `serverTiles` is the authoritative list; the Y.Doc supplies placement
   * through each tile's Y-bound `parentId`/`order`. Sections are constructed
   * first so a child is never transiently orphaned while its section is still
   * pending.
   *
   * After construction the controller observes the Y.Doc for subsequent
   * placement changes (remote edits, deletes). Observation is client-only —
   * under SSR there is no doc and placement comes from the fields' fallbacks.
   */
  bootstrap(serverTiles: ClientTile[]) {
    const ordered = [
      ...serverTiles.filter((tile) => tile.type === "SECTION"),
      ...serverTiles.filter((tile) => tile.type !== "SECTION"),
    ];
    for (const data of ordered) {
      const tile = createTile(this.page, data);
      this.page.index.set(tile.id, tile);
      this.place(tile);
    }

    const doc = this.page.doc;
    if (doc) {
      this.tilesMap = doc.getMap<Y.Map<unknown>>("tiles");
      this.tilesMap.observeDeep(this.onChange);
    }
  }

  /**
   * Inserts a tile into the collection for its current `parentId`, ordered by
   * its fractional `order`. Orphans — a `parentId` that resolves to a section
   * which does not exist — are not placed (not rendered).
   */
  private place(tile: Tile) {
    const parentId = tile.parentId.value;
    const parent = parseParentId(parentId);

    if (parent.type === "section" && !this.page.index.has(parent.sectionId)) {
      if (import.meta.env.DEV) {
        console.warn(
          `Tile ${tile.id} references missing parent ${parent.sectionId}; not rendered`,
        );
      }
      return;
    }

    const collection = this.getCollection(parentId);
    collection.insertBefore(this.beforeIdFor(collection, tile), tile);
  }

  /** Removes a tile from whichever collection currently holds it. */
  private unplace(id: string) {
    const tile = this.page.index.get(id);
    if (tile?.parent) {
      tile.parent.remove(tile);
    }
    this.page.index.delete(id);
  }

  /** Re-evaluates a tile's collection/position after a parentId/order change. */
  private reposition(id: string) {
    const tile = this.page.index.get(id);
    if (tile) {
      this.place(tile);
    }
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
    const changed = new Set<string>();

    for (const event of events) {
      if (event.target === this.tilesMap) {
        for (const [key, change] of event.changes.keys) {
          if (change.action === "add") {
            added.add(key);
          } else if (change.action === "delete") {
            removed.add(key);
          } else {
            changed.add(key);
          }
        }
      } else {
        const id = event.path[0];
        if (typeof id === "string") {
          changed.add(id);
        }
      }
    }

    for (const id of removed) {
      this.unplace(id);
    }
    for (const id of added) {
      // Locally-created tiles already have a model (the model layer writes the
      // Y.Map). Remote creation carrying no server payload is out of scope
      // until client-first creation lands (migration plan, Phase 4).
      const tile = this.page.index.get(id);
      if (tile) {
        this.place(tile);
      }
    }
    for (const id of changed) {
      if (!added.has(id) && !removed.has(id)) {
        this.reposition(id);
      }
    }
  }

  dispose() {
    this.tilesMap?.unobserveDeep(this.onChange);
    this.tilesMap = null;
    this.collections.clear();
  }
}
