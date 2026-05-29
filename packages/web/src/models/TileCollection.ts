import { BaseReactive } from "@/utils/reactivity";
import type Tile from "./Tile";

export default class TileCollection extends BaseReactive<Tile[]> {
  private items: Tile[] = [];

  get value() {
    return this.items;
  }

  append(...items: Tile[]) {
    for (const item of items) {
      if (item.parent === this) {
        const index = this.items.indexOf(item);
        if (index >= 0) {
          this.items.splice(index, 1);
        }
      } else {
        item.parent?.remove(item);
        item.parent = this;
      }

      this.items.push(item);
    }

    this.notify();
  }

  insertBefore(beforeId: string | null, ...items: Tile[]) {
    for (const item of items) {
      if (item.parent === this) {
        const index = this.items.indexOf(item);
        if (index >= 0) {
          this.items.splice(index, 1);
        }
      } else {
        item.parent?.remove(item);
        item.parent = this;
      }
    }

    let insertIndex = this.items.length;
    if (typeof beforeId === "string") {
      const beforeIndex = this.items.findIndex((item) => item.id === beforeId);
      if (beforeIndex < 0) {
        throw new Error(`ID not found: ${beforeId}`);
      }
      insertIndex = beforeIndex;
    }

    this.items.splice(insertIndex, 0, ...items);
    this.notify();
  }

  remove(tile: Tile) {
    if (tile.parent !== this) {
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
