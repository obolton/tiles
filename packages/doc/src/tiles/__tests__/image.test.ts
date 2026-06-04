import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildImageMap } from "@/tiles/image";

describe("buildImageMap", () => {
  test("sets image fields and a default origin", () => {
    const doc = new Y.Doc();
    const map = buildImageMap({
      imageId: "img1",
      size: { width: 4, height: 3 },
    });
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("IMAGE");
    expect(map.get("imageId")).toBe("img1");
    expect(map.get("size")).toEqual({ width: 4, height: 3 });
    expect(map.get("alt")).toBeNull();
    expect(map.get("text")).toBeNull();
    expect(map.get("origin")).toEqual({ x: 0, y: 0 });
  });
});
