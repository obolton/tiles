import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildSeriesMap } from "@/tiles/series";

describe("buildSeriesMap", () => {
  test("sets series fields", () => {
    const doc = new Y.Doc();
    const column = { id: "c1", title: "Col" };
    const map = buildSeriesMap("a0", { type: "BAR", column, fill: null });
    doc.getMap().set("series", map);

    expect(map.get("order")).toBe("a0");
    expect(map.get("type")).toBe("BAR");
    expect(map.get("column")).toEqual(column);
    expect(map.get("fill")).toBeNull();
  });
});
