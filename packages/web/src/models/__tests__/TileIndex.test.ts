import { describe, expect, test, vi } from "vitest";
import TileIndex from "@/models/TileIndex";
import type Tile from "@/models/Tile";

const tile = { id: "t1" } as unknown as Tile;

describe("TileIndex", () => {
  test("looks tiles up by id", () => {
    const index = new TileIndex();

    index.set("t1", tile);

    expect(index.get("t1")).toBe(tile);
    expect(index.has("t1")).toBe(true);
    expect(index.value.size).toBe(1);
  });

  test("notifies when a tile is added or removed", () => {
    const index = new TileIndex();
    const subscriber = vi.fn();
    index.subscribe(subscriber);

    index.set("t1", tile);
    index.delete("t1");
    index.delete("t1");

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(index.has("t1")).toBe(false);
  });
});
