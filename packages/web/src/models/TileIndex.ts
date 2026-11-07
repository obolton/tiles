import { BaseReactive } from "reactivity";
import type Tile from "./Tile";

/** The page's tiles by id, notifying when one is added or removed. */
export default class TileIndex extends BaseReactive<ReadonlyMap<string, Tile>> {
  private readonly tiles = new Map<string, Tile>();

  get value(): ReadonlyMap<string, Tile> {
    return this.tiles;
  }

  get(id: string): Tile | undefined {
    return this.tiles.get(id);
  }

  has(id: string): boolean {
    return this.tiles.has(id);
  }

  values(): IterableIterator<Tile> {
    return this.tiles.values();
  }

  set(id: string, tile: Tile) {
    this.tiles.set(id, tile);
    this.notify();
  }

  delete(id: string) {
    if (this.tiles.delete(id)) {
      this.notify();
    }
  }
}
