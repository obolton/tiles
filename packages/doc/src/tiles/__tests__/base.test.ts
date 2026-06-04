import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildBaseTileMap } from "@/tiles/base";

describe("buildBaseTileMap", () => {
  test("applies defaults", () => {
    const doc = new Y.Doc();
    const map = buildBaseTileMap({ type: "TEXT" });
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("TEXT");
    expect(map.get("sizing")).toBe("AUTO");
    expect(map.get("x")).toBe(0);
    expect(map.get("y")).toBe(0);
    expect(map.get("width")).toBe(0);
    expect(map.get("height")).toBe(0);
    expect(map.get("rowSpan")).toBe(0);
    expect(map.get("hide")).toBe(false);
    expect(map.get("startDate")).toBeNull();
    expect(map.get("endDate")).toBeNull();
    expect(map.get("coordinates")).toBeNull();
    expect(map.get("animation")).toBeNull();
    expect(map.get("frame")).toBeNull();
    expect(map.get("cornerRadius")).toBe(0);
    expect(map.get("textColor")).toBeNull();
    expect(map.get("background")).toBeNull();
  });

  test("preserves provided values, including an explicit null width", () => {
    const doc = new Y.Doc();
    const map = buildBaseTileMap({
      type: "IMAGE",
      width: null,
      x: 5,
      sizing: "CUSTOM",
    });
    doc.getMap().set("tile", map);

    expect(map.get("width")).toBeNull();
    expect(map.get("x")).toBe(5);
    expect(map.get("sizing")).toBe("CUSTOM");
  });
});
