import { BaseReactive } from "@/utils/reactivity";
import type Tile from "./Tile";

export interface TileParent {
  id?: string;
  tiles: TileCollection;
}

export default class TileCollection extends BaseReactive<Tile[]> {
  readonly owner: TileParent;

  private items: Tile[] = [];

  constructor(owner: TileParent) {
    super();
    this.owner = owner;
  }

  get value() {
    return this.items;
  }

  append(...items: Tile[]) {
    for (const item of items) {
      if (item.parent === this.owner) {
        const index = this.items.indexOf(item);
        if (index >= 0) {
          this.items.splice(index, 1);
        }
      } else {
        item.parent?.tiles.remove(item);
        item.parent = this.owner;
      }

      this.items.push(item);
    }

    this.notify();
  }

  insertAfter(afterId: string | null, ...items: Tile[]) {
    for (const item of items) {
      if (item.parent === this.owner) {
        const index = this.items.indexOf(item);
        if (index >= 0) {
          this.items.splice(index, 1);
        }
      } else {
        item.parent?.tiles.remove(item);
        item.parent = this.owner;
      }
    }

    let insertIndex = 0;
    if (typeof afterId === "string") {
      const afterIndex = this.items.findIndex((item) => item.id === afterId);
      if (afterIndex < 0) {
        throw new Error(`ID not found: ${afterId}`);
      }
      insertIndex = afterIndex + 1;
    }

    this.items.splice(insertIndex, 0, ...items);
    this.notify();
  }

  remove(tile: Tile) {
    if (tile.parent !== this.owner) {
      throw new Error("Tile to remove is not contained in collection");
    }

    const index = this.items.indexOf(tile);
    if (index < 0) {
      throw new Error(`Item not found: ${tile.id}`);
    }

    tile.parent = null;
    this.items.splice(index, 1);
    this.notify();
  }
}
