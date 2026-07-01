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

  test("builds the series map", () => {
    const doc = new Y.Doc();
    const map = buildChartMap({
      tableId: "t1",
      series: [
        { type: "BAR", column: { id: "c1", title: "Revenue" }, fill: null },
        { type: "LINE", column: { id: "c2", title: "Profit" }, fill: null },
      ],
    });
    doc.getMap().set("tile", map);

    const series = map.get("series") as Y.Map<Y.Map<unknown>>;
    expect(series.size).toBe(2);
    expect([...series.values()].map((s) => (s.get("column") as { id: string }).id)).toEqual([
      "c1",
      "c2",
    ]);
  });
});
