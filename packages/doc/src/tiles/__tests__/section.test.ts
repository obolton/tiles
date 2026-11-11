import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildSectionMap } from "@/tiles/section";

describe("buildSectionMap", () => {
  test("applies layout defaults", () => {
    const doc = new Y.Doc();
    const map = buildSectionMap({});
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("SECTION");
    expect(map.get("layout")).toBe("VERTICAL");
    expect(map.get("mapStyle")).toBeNull();
    expect(map.get("columns")).toBeNull();
  });

  test("defaults to custom sizing", () => {
    const doc = new Y.Doc();
    const map = buildSectionMap({ layout: "GRID", height: 15 });
    doc.getMap().set("tile", map);

    expect(map.get("sizing")).toBe("CUSTOM");
    expect(map.get("height")).toBe(15);
  });

  test("respects a provided sizing", () => {
    const doc = new Y.Doc();
    const map = buildSectionMap({ layout: "FREEFORM", sizing: "FOUR_THREE" });
    doc.getMap().set("tile", map);

    expect(map.get("sizing")).toBe("FOUR_THREE");
  });

  test("respects provided layout fields", () => {
    const doc = new Y.Doc();
    const map = buildSectionMap({ layout: "GRID", columns: 3 });
    doc.getMap().set("tile", map);

    expect(map.get("layout")).toBe("GRID");
    expect(map.get("columns")).toBe(3);
  });
});
