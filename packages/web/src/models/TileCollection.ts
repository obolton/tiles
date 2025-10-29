import { BaseReactive } from "@/utils/reactivity";
import type Tile from "./Tile";

export default class TileCollection extends BaseReactive<Tile[]> {
  private items: Tile[] = [];

  get value() {
    return this.items;
  }

  append(...items: Tile[]) {
    for (const item of items) {
      if (!this.items.includes(item)) {
        this.items.push(item);
      }
    }
    this.notify();
  }

  insertAfter(afterId: string | null, ...items: Tile[]) {
    let insertIndex = 0;

    if (typeof afterId === "string") {
      const afterIndex = this.items.findIndex((item) => item.id === afterId);
      if (afterIndex < 0) {
        throw new Error(`ID not found: ${afterId}`);
      }
      insertIndex = afterIndex + 1;
    }

    for (const item of items) {
      const index = this.items.indexOf(item);
      if (index >= 0) {
        this.items.splice(index, 1);
      }
    }

    this.items.splice(insertIndex, 0, ...items);
    this.notify();
  }

  remove(tile: Tile) {
    const index = this.items.indexOf(tile);
    if (index < 0) {
      throw new Error(`Item not found: ${tile.id}`);
    }

    this.items.splice(index, 1);
    this.notify();
  }
}
