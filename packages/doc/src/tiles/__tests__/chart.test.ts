import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildChartMap } from "@/tiles/chart";

describe("buildChartMap", () => {
  test("sets chart fields and an empty series map", () => {
    const doc = new Y.Doc();
    const map = buildChartMap({ tableId: "t1" });
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("CHART");
    expect(map.get("tableId")).toBe("t1");
    expect(map.get("label")).toBeNull();
    const series = map.get("series");
    expect(series).toBeInstanceOf(Y.Map);
    expect((series as Y.Map<unknown>).size).toBe(0);
  });
});
