import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildTableMap } from "@/tiles/table";
import { orderedEntries } from "@/placement/ordering";

describe("buildTableMap", () => {
  test("sets table fields and empty column and row maps", () => {
    const doc = new Y.Doc();
    const map = buildTableMap({});
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("TABLE");
    expect(map.get("sizing")).toBe("CUSTOM");

    const columns = map.get("columns");
    expect(columns).toBeInstanceOf(Y.Map);
    expect((columns as Y.Map<unknown>).size).toBe(0);

    const rows = map.get("rows");
    expect(rows).toBeInstanceOf(Y.Map);
    expect((rows as Y.Map<unknown>).size).toBe(0);
  });

  test("respects sizing", () => {
    const doc = new Y.Doc();
    const map = buildTableMap({ sizing: "LANDSCAPE" });
    doc.getMap().set("tile", map);

    expect(map.get("sizing")).toBe("LANDSCAPE");
  });

  test("seeds a count of empty columns and rows", () => {
    const doc = new Y.Doc();
    const map = buildTableMap({ columns: 3, rows: 2 });
    doc.getMap().set("tile", map);

    expect((map.get("columns") as Y.Map<unknown>).size).toBe(3);
    expect((map.get("rows") as Y.Map<unknown>).size).toBe(2);
  });

  test("seeds columns by id and rows with cells addressed by column index", () => {
    const doc = new Y.Doc();
    const map = buildTableMap({
      columns: [
        { id: "col-1", title: "Month" },
        { id: "col-2", title: "Revenue" },
      ],
      rows: [{ cells: ["Jan", "100"] }],
    });
    doc.getMap().set("tile", map);

    const columns = orderedEntries(map.get("columns") as Y.Map<Y.Map<unknown>>);
    expect(columns.map((c) => c.id)).toEqual(["col-1", "col-2"]);
    expect(columns.map((c) => c.map.get("title"))).toEqual(["Month", "Revenue"]);

    const rows = orderedEntries(map.get("rows") as Y.Map<Y.Map<unknown>>);
    const cells = rows[0]!.map.get("cells") as Y.Map<unknown>;
    expect(cells.get("col-1")).toBe("Jan");
    expect(cells.get("col-2")).toBe("100");
  });
});
