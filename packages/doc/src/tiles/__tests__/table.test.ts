import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { buildTableMap, parseTableChanges } from "@/tiles/table";
import { orderedEntries } from "@/placement/ordering";

describe("buildTableMap", () => {
  test("sets table fields and empty column and row maps", () => {
    const doc = new Y.Doc();
    const map = buildTableMap({});
    doc.getMap().set("tile", map);

    expect(map.get("type")).toBe("TABLE");

    const columns = map.get("columns");
    expect(columns).toBeInstanceOf(Y.Map);
    expect((columns as Y.Map<unknown>).size).toBe(0);

    const rows = map.get("rows");
    expect(rows).toBeInstanceOf(Y.Map);
    expect((rows as Y.Map<unknown>).size).toBe(0);
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
    expect(columns.map((c) => c.map.get("title"))).toEqual([
      "Month",
      "Revenue",
    ]);

    const rows = orderedEntries(map.get("rows") as Y.Map<Y.Map<unknown>>);
    const cells = rows[0]!.map.get("cells") as Y.Map<unknown>;
    expect(cells.get("col-1")).toBe("Jan");
    expect(cells.get("col-2")).toBe("100");
  });
});

describe("parseTableChanges", () => {
  function buildTable() {
    const doc = new Y.Doc();
    const map = buildTableMap({
      columns: [
        { id: "col-1", title: "Month" },
        { id: "col-2", title: "Revenue" },
      ],
      rows: [{ cells: ["Jan", "100"] }, { cells: ["Feb", "200"] }],
    });
    doc.getMap().set("tile", map);

    const columns = map.get("columns") as Y.Map<Y.Map<unknown>>;
    const rows = map.get("rows") as Y.Map<Y.Map<unknown>>;
    const [row] = orderedEntries(rows);
    const [column] = orderedEntries(columns);
    if (!row || !column) {
      throw new Error("expected seeded rows and columns");
    }

    return { doc, columns, rows, row, column };
  }

  test("emits a cell change for an edited cell", () => {
    const { rows, row } = buildTable();
    let events: Y.YEvent<Y.AbstractType<unknown>>[] = [];
    rows.observeDeep((next) => {
      events = next;
    });

    (row.map.get("cells") as Y.Map<unknown>).set("col-1", "Q1");

    expect(parseTableChanges(events, "rows")).toEqual([
      { type: "cell", rowId: row.id, columnId: "col-1" },
    ]);
  });

  test("emits a cell change for each column changed in a transaction", () => {
    const { doc, rows, row } = buildTable();
    let events: Y.YEvent<Y.AbstractType<unknown>>[] = [];
    rows.observeDeep((next) => {
      events = next;
    });

    doc.transact(() => {
      const cells = row.map.get("cells") as Y.Map<unknown>;
      cells.set("col-1", "Q1");
      cells.set("col-2", "150");
    });

    const changes = parseTableChanges(events, "rows");
    expect(changes).toHaveLength(2);
    expect(changes).toContainEqual({
      type: "cell",
      rowId: row.id,
      columnId: "col-1",
    });
    expect(changes).toContainEqual({
      type: "cell",
      rowId: row.id,
      columnId: "col-2",
    });
  });

  test("emits a row change for a field edit", () => {
    const { rows, row } = buildTable();
    let events: Y.YEvent<Y.AbstractType<unknown>>[] = [];
    rows.observeDeep((next) => {
      events = next;
    });

    row.map.set("height", 64);

    expect(parseTableChanges(events, "rows")).toEqual([
      { type: "row", rowId: row.id },
    ]);
  });

  test("emits a moveRow change for an order edit", () => {
    const { rows, row } = buildTable();
    let events: Y.YEvent<Y.AbstractType<unknown>>[] = [];
    rows.observeDeep((next) => {
      events = next;
    });

    row.map.set("order", "a5");

    expect(parseTableChanges(events, "rows")).toEqual([
      { type: "moveRow", rowId: row.id },
    ]);
  });

  test("emits a column change for a field edit", () => {
    const { columns, column } = buildTable();
    let events: Y.YEvent<Y.AbstractType<unknown>>[] = [];
    columns.observeDeep((next) => {
      events = next;
    });

    column.map.set("title", "Quarter");

    expect(parseTableChanges(events, "columns")).toEqual([
      { type: "column", columnId: column.id },
    ]);
  });

  test("emits a moveColumn change for an order edit", () => {
    const { columns, column } = buildTable();
    let events: Y.YEvent<Y.AbstractType<unknown>>[] = [];
    columns.observeDeep((next) => {
      events = next;
    });

    column.map.set("order", "a5");

    expect(parseTableChanges(events, "columns")).toEqual([
      { type: "moveColumn", columnId: column.id },
    ]);
  });

  test("ignores membership changes", () => {
    const { rows } = buildTable();
    let events: Y.YEvent<Y.AbstractType<unknown>>[] = [];
    rows.observeDeep((next) => {
      events = next;
    });

    rows.set("row-3", new Y.Map());

    expect(parseTableChanges(events, "rows")).toEqual([]);
  });
});
