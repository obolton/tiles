import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Table from "@/models/Table";
import { buildSectionMap } from "doc/tiles/section";
import { buildTableMap, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from "doc/tiles/table";
import { PAGE } from "@/test/fixtures/Page";

const editor = Editor.init(PAGE, new Y.Doc());
const { page } = editor;

function createTable(): Table {
  return page.createTile(
    buildTableMap({
      columns: [
        { id: "col-1", title: "Month" },
        { id: "col-2", title: "Revenue" },
      ],
      rows: [{ cells: ["Jan", "100"] }, { cells: ["Feb", "200"] }],
    }),
    {},
  ) as Table;
}

function createGrid(): Table {
  return page.createTile(
    buildTableMap({
      columns: [{ id: "a" }, { id: "b" }, { id: "c" }],
      rows: [
        { cells: ["a1", "b1", "c1"] },
        { cells: ["a2", "b2", "c2"] },
        { cells: ["a3", "b3", "c3"] },
      ],
    }),
    {},
  ) as Table;
}

function getYMap(parent: Y.Map<unknown>, key: string): Y.Map<unknown> {
  const value = parent.get(key);
  if (!(value instanceof Y.Map)) {
    throw new Error(`Expected a Y.Map at "${key}"`);
  }
  return value;
}

function tileMap(table: Table): Y.Map<unknown> {
  return getYMap(page.doc.getMap("tiles"), table.id);
}

function columnIds(table: Table): string[] {
  return table.columns.value.map((column) => column.id);
}

function rowIds(table: Table): string[] {
  return table.rows.value.map((row) => row.id);
}

function orderOf(table: Table, kind: "columns" | "rows", id: string): unknown {
  return getYMap(getYMap(tileMap(table), kind), id).get("order");
}

function cellsOf(table: Table, rowId: string): Record<string, unknown> {
  return getYMap(getYMap(getYMap(tileMap(table), "rows"), rowId), "cells").toJSON();
}

function allCells(table: Table): Record<string, unknown>[] {
  return rowIds(table).map((rowId) => cellsOf(table, rowId));
}

function countTransactions(run: () => void): number {
  let count = 0;
  const onTransaction = () => {
    count++;
  };
  page.doc.on("afterTransaction", onTransaction);
  try {
    run();
  } finally {
    page.doc.off("afterTransaction", onTransaction);
  }
  return count;
}

describe("Table", () => {
  describe("getColumnData", () => {
    test("reads a column's cells in row order", () => {
      const table = createTable();

      expect(table.getColumnData("col-1").value).toEqual(["Jan", "Feb"]);
      expect(table.getColumnData("col-2").value).toEqual(["100", "200"]);
    });

    test("notifies and updates when a cell changes", () => {
      const table = createTable();
      const data = table.getColumnData("col-2");
      const subscriber = vi.fn();
      data.subscribe(subscriber);

      const rowId = table.rows.value[0]!.id;
      table.updateCell({ rowId, columnId: "col-2", value: "999" });

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(data.value).toEqual(["999", "200"]);
    });

    test("notifies and updates when a row is added", () => {
      const table = createTable();
      const data = table.getColumnData("col-2");
      const subscriber = vi.fn();
      data.subscribe(subscriber);

      table.appendRow();

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(data.value).toEqual(["100", "200", null]);
    });
  });

  describe("create", () => {
    test("adds the table to the page at the given placement and selects it", async () => {
      const section = page.createTile(buildSectionMap({ layout: "VERTICAL" }), {});
      const addTile = vi.spyOn(editor, "addTile");

      const table = await Table.create(page, { parentId: section.id, columns: 2, rows: 1 });

      expect(table).toBeInstanceOf(Table);
      expect(table.parentId.value).toBe(section.id);
      expect(table.sizing.value).toBe("CUSTOM");
      expect(columnIds(table)).toHaveLength(2);
      expect(rowIds(table)).toHaveLength(1);
      expect(page.doc.getMap("tiles").has(table.id)).toBe(true);
      expect(addTile).toHaveBeenCalledWith(table);
      addTile.mockRestore();
    });
  });

  describe("constructor", () => {
    test("throws when the map has no columns or rows", () => {
      const map = buildTableMap({});
      map.set("id", "broken-table");
      // A detached Y.Map cannot be read, so attach it to a scratch doc.
      new Y.Doc().getMap("tiles").set("broken-table", map);
      map.delete("rows");

      expect(() => new Table(page, map)).toThrow("Table tile missing columns or rows");
    });
  });

  describe("insertColumn", () => {
    test("inserts between the given column and its successor", () => {
      const table = createTable();

      const column = table.insertColumn("col-1");

      expect(columnIds(table)).toEqual(["col-1", column.id, "col-2"]);
    });

    test("inserts first when given null", () => {
      const table = createTable();

      const column = table.insertColumn(null);

      expect(columnIds(table)).toEqual([column.id, "col-1", "col-2"]);
    });

    test("inserts last after the last column", () => {
      const table = createTable();

      const column = table.insertColumn("col-2");

      expect(columnIds(table)).toEqual(["col-1", "col-2", column.id]);
    });

    test("creates a column with default fields and no cells", () => {
      const table = createTable();

      const column = table.insertColumn("col-2");

      expect(column.title.value).toBeNull();
      expect(column.width.value).toBe(DEFAULT_COLUMN_WIDTH);
      expect(table.getColumnData(column.id).value).toEqual([null, null]);
    });

    test("writes in a single transaction", () => {
      const table = createTable();

      expect(countTransactions(() => table.insertColumn("col-1"))).toBe(1);
    });
  });

  describe("moveColumn", () => {
    test("moves a column after another", () => {
      const table = createGrid();

      table.moveColumn("c", "a");

      expect(columnIds(table)).toEqual(["a", "c", "b"]);
    });

    test("moves a column to the front when given null", () => {
      const table = createGrid();

      table.moveColumn("c", null);

      expect(columnIds(table)).toEqual(["c", "a", "b"]);
    });

    test("leaves sibling orders untouched", () => {
      const table = createGrid();
      const before = { a: orderOf(table, "columns", "a"), b: orderOf(table, "columns", "b") };

      table.moveColumn("c", null);

      expect(orderOf(table, "columns", "a")).toBe(before.a);
      expect(orderOf(table, "columns", "b")).toBe(before.b);
    });

    test("ignores unknown ids", () => {
      const table = createGrid();

      table.moveColumn("missing", "a");

      expect(columnIds(table)).toEqual(["a", "b", "c"]);
    });

    test("writes in a single transaction", () => {
      const table = createGrid();

      expect(countTransactions(() => table.moveColumn("c", "a"))).toBe(1);
    });
  });

  describe("removeColumns", () => {
    test("removes the columns and their cells from every row", () => {
      const table = createGrid();

      table.removeColumns(["a", "c"]);

      expect(columnIds(table)).toEqual(["b"]);
      expect(allCells(table)).toEqual([{ b: "b1" }, { b: "b2" }, { b: "b3" }]);
    });

    test("removes columns and cells in a single transaction", () => {
      const table = createGrid();

      expect(countTransactions(() => table.removeColumns(["a", "b"]))).toBe(1);
    });

    test("does nothing for an empty list", () => {
      const table = createGrid();

      expect(countTransactions(() => table.removeColumns([]))).toBe(0);
      expect(columnIds(table)).toEqual(["a", "b", "c"]);
    });
  });

  describe("insertRow", () => {
    test("inserts between the given row and its successor", () => {
      const table = createTable();
      const [first, second] = rowIds(table);

      const row = table.insertRow(first!);

      expect(rowIds(table)).toEqual([first, row.id, second]);
    });

    test("inserts first when given null", () => {
      const table = createTable();
      const existing = rowIds(table);

      const row = table.insertRow(null);

      expect(rowIds(table)).toEqual([row.id, ...existing]);
    });

    test("creates a row with default fields and empty cells", () => {
      const table = createTable();

      const row = table.insertRow(null);

      expect(row.height.value).toBe(DEFAULT_ROW_HEIGHT);
      expect(row.background.value).toBeNull();
      expect(cellsOf(table, row.id)).toEqual({});
    });

    test("writes in a single transaction", () => {
      const table = createTable();

      expect(countTransactions(() => table.insertRow(null))).toBe(1);
    });
  });

  describe("appendRow", () => {
    test("adds a row at the end", () => {
      const table = createTable();
      const existing = rowIds(table);

      const row = table.appendRow();

      expect(rowIds(table)).toEqual([...existing, row.id]);
    });

    test("adds the first row of an empty table", () => {
      const table = page.createTile(buildTableMap({ columns: 1 }), {}) as Table;

      const row = table.appendRow();

      expect(rowIds(table)).toEqual([row.id]);
    });
  });

  describe("moveRow", () => {
    test("moves a row after another", () => {
      const table = createGrid();
      const [r1, r2, r3] = rowIds(table);

      table.moveRow(r3!, r1!);

      expect(rowIds(table)).toEqual([r1, r3, r2]);
    });

    test("moves a row to the top when given null", () => {
      const table = createGrid();
      const [r1, r2, r3] = rowIds(table);

      table.moveRow(r3!, null);

      expect(rowIds(table)).toEqual([r3, r1, r2]);
    });

    test("leaves sibling orders and cells untouched", () => {
      const table = createGrid();
      const [r1, r2, r3] = rowIds(table);
      const before = { r1: orderOf(table, "rows", r1!), r2: orderOf(table, "rows", r2!) };

      table.moveRow(r3!, null);

      expect(orderOf(table, "rows", r1!)).toBe(before.r1);
      expect(orderOf(table, "rows", r2!)).toBe(before.r2);
      expect(cellsOf(table, r3!)).toEqual({ a: "a3", b: "b3", c: "c3" });
    });

    test("ignores unknown ids", () => {
      const table = createGrid();
      const before = rowIds(table);

      table.moveRow("missing", null);

      expect(rowIds(table)).toEqual(before);
    });

    test("writes in a single transaction", () => {
      const table = createGrid();
      const [r1, , r3] = rowIds(table);

      expect(countTransactions(() => table.moveRow(r3!, r1!))).toBe(1);
    });
  });

  describe("removeRows", () => {
    test("removes the rows", () => {
      const table = createGrid();
      const [r1, r2, r3] = rowIds(table);

      table.removeRows([r1!, r3!]);

      expect(rowIds(table)).toEqual([r2]);
      expect(getYMap(tileMap(table), "rows").has(r1!)).toBe(false);
    });

    test("removes rows in a single transaction", () => {
      const table = createGrid();
      const [r1, r2] = rowIds(table);

      expect(countTransactions(() => table.removeRows([r1!, r2!]))).toBe(1);
    });

    test("does nothing for an empty list", () => {
      const table = createGrid();
      const before = rowIds(table);

      expect(countTransactions(() => table.removeRows([]))).toBe(0);
      expect(rowIds(table)).toEqual(before);
    });
  });

  describe("updateCell", () => {
    test("sets a cell value", () => {
      const table = createTable();
      const rowId = rowIds(table)[0]!;

      table.updateCell({ rowId, columnId: "col-2", value: "150" });

      expect(cellsOf(table, rowId)).toEqual({ "col-1": "Jan", "col-2": "150" });
      expect(table.rows.get(rowId).cell("col-2")).toBe("150");
    });

    test("stores rich text values", () => {
      const table = createTable();
      const rowId = rowIds(table)[0]!;
      const value = [{ type: "paragraph" as const, align: 0, children: [] }];

      table.updateCell({ rowId, columnId: "col-2", value });

      expect(table.rows.get(rowId).cell("col-2")).toEqual(value);
    });

    test("deletes the cell when the value is null", () => {
      const table = createTable();
      const rowId = rowIds(table)[0]!;

      table.updateCell({ rowId, columnId: "col-1", value: null });

      expect(cellsOf(table, rowId)).toEqual({ "col-2": "100" });
    });

    test("deletes the cell when the value is an empty string", () => {
      const table = createTable();
      const rowId = rowIds(table)[0]!;

      table.updateCell({ rowId, columnId: "col-1", value: "" });

      expect(cellsOf(table, rowId)).toEqual({ "col-2": "100" });
    });

    test("ignores unknown rows", () => {
      const table = createTable();
      const before = allCells(table);

      table.updateCell({ rowId: "missing", columnId: "col-1", value: "x" });

      expect(allCells(table)).toEqual(before);
    });

    test("writes in a single transaction", () => {
      const table = createTable();
      const rowId = rowIds(table)[0]!;

      expect(
        countTransactions(() => table.updateCell({ rowId, columnId: "col-1", value: "x" })),
      ).toBe(1);
    });
  });

  describe("clearRanges", () => {
    test("clears a rectangular cell range", () => {
      const table = createGrid();
      const [r1, r2] = rowIds(table);

      table.clearRanges({
        ranges: [{ type: "cells", from: { row: r1!, column: "b" }, to: { row: r2!, column: "c" } }],
      });

      expect(allCells(table)).toEqual([{ a: "a1" }, { a: "a2" }, { a: "a3", b: "b3", c: "c3" }]);
    });

    test("accepts a reversed cell range", () => {
      const table = createGrid();
      const [r1, r2] = rowIds(table);

      table.clearRanges({
        ranges: [{ type: "cells", from: { row: r2!, column: "c" }, to: { row: r1!, column: "b" } }],
      });

      expect(allCells(table)).toEqual([{ a: "a1" }, { a: "a2" }, { a: "a3", b: "b3", c: "c3" }]);
    });

    test("clears every cell of the rows in a row range", () => {
      const table = createGrid();
      const [, r2, r3] = rowIds(table);

      table.clearRanges({ ranges: [{ type: "rows", from: r3!, to: r2! }] });

      expect(allCells(table)).toEqual([{ a: "a1", b: "b1", c: "c1" }, {}, {}]);
    });

    test("clears the cells of the columns in a column range from every row", () => {
      const table = createGrid();

      table.clearRanges({ ranges: [{ type: "columns", from: "c", to: "b" }] });

      expect(allCells(table)).toEqual([{ a: "a1" }, { a: "a2" }, { a: "a3" }]);
    });

    test("ignores ranges with ids that are not in the table", () => {
      const table = createGrid();
      const [r1] = rowIds(table);
      const before = allCells(table);

      table.clearRanges({
        ranges: [
          { type: "columns", from: "a", to: "missing" },
          { type: "rows", from: "missing", to: r1! },
          { type: "cells", from: { row: r1!, column: "missing" }, to: { row: r1!, column: "a" } },
          { type: "cells", from: { row: "missing", column: "a" }, to: { row: r1!, column: "a" } },
        ],
      });

      expect(allCells(table)).toEqual(before);
    });

    test("applies several ranges in a single transaction", () => {
      const table = createGrid();
      const [r1, r2, r3] = rowIds(table);

      const transactions = countTransactions(() =>
        table.clearRanges({
          ranges: [
            { type: "columns", from: "a", to: "a" },
            { type: "rows", from: r3!, to: r3! },
            { type: "cells", from: { row: r1!, column: "c" }, to: { row: r1!, column: "c" } },
          ],
        }),
      );

      expect(transactions).toBe(1);
      expect(allCells(table)).toEqual([{ b: "b1" }, { b: "b2", c: "c2" }, {}]);
      expect(rowIds(table)).toEqual([r1, r2, r3]);
    });

    test("does not write when given no ranges", () => {
      const table = createGrid();
      const before = allCells(table);

      table.clearRanges({ ranges: [] });

      expect(allCells(table)).toEqual(before);
    });
  });

  describe("dispose", () => {
    test("disposes the column and row lists", () => {
      const table = createGrid();
      const columns = vi.fn();
      const rows = vi.fn();
      table.columns.subscribe(columns);
      table.rows.subscribe(rows);

      table.dispose();

      expect(table.columns.value).toEqual([]);
      expect(table.rows.value).toEqual([]);
      columns.mockClear();
      rows.mockClear();
      page.doc.transact(() => {
        getYMap(tileMap(table), "columns").delete("a");
      });
      expect(columns).not.toHaveBeenCalled();
      expect(rows).not.toHaveBeenCalled();
    });
  });
});
