import { beforeEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { createEditor } from "@/test/editor";
import Table from "@/models/Table";
import type { CellValue } from "@/models/Table";
import { buildSectionMap } from "doc/tiles/section";
import { buildTableMap, DEFAULT_COLUMN_WIDTH, DEFAULT_ROW_HEIGHT } from "doc/tiles/table";
import type Editor from "@/editor/Editor";

describe("Table", () => {
  let editor: Editor;
  let table: Table;
  let r1: string;
  let r2: string;
  let r3: string;

  beforeEach(() => {
    editor = createEditor();
    table = editor.page.createTile(
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
    [r1, r2, r3] = table.rows.value.map((row) => row.id) as [string, string, string];
  });

  function columnIds(): string[] {
    return table.columns.value.map((column) => column.id);
  }

  function rowIds(): string[] {
    return table.rows.value.map((row) => row.id);
  }

  /** Every row's cells in column order, `null` where a cell is unset. */
  function cells(): CellValue[][] {
    return table.rows.value.map((row) => columnIds().map((columnId) => row.cell(columnId)));
  }

  describe("create", () => {
    test("adds the table to the page and selects it", async () => {
      const section = editor.page.createTile(buildSectionMap({ layout: "VERTICAL" }), {});
      const addTile = vi.spyOn(editor, "addTile");

      const created = await Table.create(editor.page, {
        parentId: section.id,
        columns: 2,
        rows: 1,
      });

      expect(created).toBeInstanceOf(Table);
      expect(created.parentId.value).toBe(section.id);
      expect(created.sizing.value).toBe("CUSTOM");
      expect(created.columns.value).toHaveLength(2);
      expect(created.rows.value).toHaveLength(1);
      expect(addTile).toHaveBeenCalledWith(created);
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

      expect(() => new Table(editor.page, map)).toThrow("Table tile missing columns or rows");
    });
  });

  describe("getColumnData", () => {
    test("reads a column's cells in row order", () => {
      expect(table.getColumnData("a").value).toEqual(["a1", "a2", "a3"]);
      expect(table.getColumnData("c").value).toEqual(["c1", "c2", "c3"]);
    });

    test("notifies and updates when a cell changes", () => {
      const data = table.getColumnData("b");
      const subscriber = vi.fn();
      data.subscribe(subscriber);

      table.updateCell({ rowId: r1, columnId: "b", value: "999" });

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(data.value).toEqual(["999", "b2", "b3"]);
    });

    test("notifies and updates when a row is added", () => {
      const data = table.getColumnData("b");
      const subscriber = vi.fn();
      data.subscribe(subscriber);

      table.appendRow();

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(data.value).toEqual(["b1", "b2", "b3", null]);
    });
  });

  describe("insertColumn", () => {
    test("inserts after the given column", () => {
      const column = table.insertColumn("a");

      expect(columnIds()).toEqual(["a", column.id, "b", "c"]);
    });

    test("inserts first when given null", () => {
      const column = table.insertColumn(null);

      expect(columnIds()).toEqual([column.id, "a", "b", "c"]);
    });

    test("inserts last after the last column", () => {
      const column = table.insertColumn("c");

      expect(columnIds()).toEqual(["a", "b", "c", column.id]);
    });

    test("creates a column with default fields and no cells", () => {
      const column = table.insertColumn("c");

      expect(column.title.value).toBeNull();
      expect(column.width.value).toBe(DEFAULT_COLUMN_WIDTH);
      expect(table.getColumnData(column.id).value).toEqual([null, null, null]);
    });
  });

  describe("moveColumn", () => {
    test("moves a column after another", () => {
      table.moveColumn("c", "a");

      expect(columnIds()).toEqual(["a", "c", "b"]);
    });

    test("moves a column to the front when given null", () => {
      table.moveColumn("c", null);

      expect(columnIds()).toEqual(["c", "a", "b"]);
    });

    test("keeps cells with their columns", () => {
      table.moveColumn("c", null);

      expect(cells()).toEqual([
        ["c1", "a1", "b1"],
        ["c2", "a2", "b2"],
        ["c3", "a3", "b3"],
      ]);
    });

    test("ignores unknown ids", () => {
      table.moveColumn("missing", "a");

      expect(columnIds()).toEqual(["a", "b", "c"]);
    });
  });

  describe("removeColumns", () => {
    test("removes the columns and their cells from every row", () => {
      table.removeColumns(["a", "c"]);

      expect(columnIds()).toEqual(["b"]);
      expect(cells()).toEqual([["b1"], ["b2"], ["b3"]]);
      expect(table.rows.get(r1).cell("a")).toBeNull();
    });

    test("does nothing for an empty list", () => {
      table.removeColumns([]);

      expect(columnIds()).toEqual(["a", "b", "c"]);
    });
  });

  describe("insertRow", () => {
    test("inserts after the given row", () => {
      const row = table.insertRow(r1);

      expect(rowIds()).toEqual([r1, row.id, r2, r3]);
    });

    test("inserts first when given null", () => {
      const row = table.insertRow(null);

      expect(rowIds()).toEqual([row.id, r1, r2, r3]);
    });

    test("creates a row with default fields and empty cells", () => {
      const row = table.insertRow(null);

      expect(row.height.value).toBe(DEFAULT_ROW_HEIGHT);
      expect(row.background.value).toBeNull();
      expect(cells()[0]).toEqual([null, null, null]);
    });
  });

  describe("appendRow", () => {
    test("adds a row at the end", () => {
      const row = table.appendRow();

      expect(rowIds()).toEqual([r1, r2, r3, row.id]);
    });

    test("adds the first row of an empty table", () => {
      const empty = editor.page.createTile(buildTableMap({ columns: 1 }), {}) as Table;

      const row = empty.appendRow();

      expect(empty.rows.value.map((r) => r.id)).toEqual([row.id]);
    });
  });

  describe("moveRow", () => {
    test("moves a row after another", () => {
      table.moveRow(r3, r1);

      expect(rowIds()).toEqual([r1, r3, r2]);
    });

    test("moves a row to the top when given null", () => {
      table.moveRow(r3, null);

      expect(rowIds()).toEqual([r3, r1, r2]);
      expect(cells()[0]).toEqual(["a3", "b3", "c3"]);
    });

    test("ignores unknown ids", () => {
      table.moveRow("missing", null);

      expect(rowIds()).toEqual([r1, r2, r3]);
    });
  });

  describe("removeRows", () => {
    test("removes the rows", () => {
      table.removeRows([r1, r3]);

      expect(rowIds()).toEqual([r2]);
    });

    test("does nothing for an empty list", () => {
      table.removeRows([]);

      expect(rowIds()).toEqual([r1, r2, r3]);
    });
  });

  describe("updateCell", () => {
    test("sets a cell value", () => {
      table.updateCell({ rowId: r1, columnId: "b", value: "150" });

      expect(cells()[0]).toEqual(["a1", "150", "c1"]);
    });

    test("stores rich text values", () => {
      const value = [{ type: "paragraph" as const, align: 0, children: [] }];

      table.updateCell({ rowId: r1, columnId: "b", value });

      expect(table.rows.get(r1).cell("b")).toEqual(value);
    });

    test("clears the cell when the value is null", () => {
      table.updateCell({ rowId: r1, columnId: "a", value: null });

      expect(cells()[0]).toEqual([null, "b1", "c1"]);
    });

    test("clears the cell when the value is an empty string", () => {
      table.updateCell({ rowId: r1, columnId: "a", value: "" });

      expect(cells()[0]).toEqual([null, "b1", "c1"]);
    });

    test("ignores unknown rows", () => {
      const before = cells();

      table.updateCell({ rowId: "missing", columnId: "a", value: "x" });

      expect(cells()).toEqual(before);
    });
  });

  describe("clearRanges", () => {
    test("clears a rectangular cell range", () => {
      table.clearRanges({
        ranges: [{ type: "cells", from: { row: r1, column: "b" }, to: { row: r2, column: "c" } }],
      });

      expect(cells()).toEqual([
        ["a1", null, null],
        ["a2", null, null],
        ["a3", "b3", "c3"],
      ]);
    });

    test("accepts a reversed cell range", () => {
      table.clearRanges({
        ranges: [{ type: "cells", from: { row: r2, column: "c" }, to: { row: r1, column: "b" } }],
      });

      expect(cells()).toEqual([
        ["a1", null, null],
        ["a2", null, null],
        ["a3", "b3", "c3"],
      ]);
    });

    test("clears every cell of the rows in a row range", () => {
      table.clearRanges({ ranges: [{ type: "rows", from: r3, to: r2 }] });

      expect(cells()).toEqual([
        ["a1", "b1", "c1"],
        [null, null, null],
        [null, null, null],
      ]);
    });

    test("clears the columns in a column range from every row", () => {
      table.clearRanges({ ranges: [{ type: "columns", from: "c", to: "b" }] });

      expect(cells()).toEqual([
        ["a1", null, null],
        ["a2", null, null],
        ["a3", null, null],
      ]);
    });

    test("applies several ranges", () => {
      table.clearRanges({
        ranges: [
          { type: "columns", from: "a", to: "a" },
          { type: "rows", from: r3, to: r3 },
          { type: "cells", from: { row: r1, column: "c" }, to: { row: r1, column: "c" } },
        ],
      });

      expect(cells()).toEqual([
        [null, "b1", null],
        [null, "b2", "c2"],
        [null, null, null],
      ]);
    });

    test("ignores ranges with ids that are not in the table", () => {
      const before = cells();

      table.clearRanges({
        ranges: [
          { type: "columns", from: "a", to: "missing" },
          { type: "rows", from: "missing", to: r1 },
          { type: "cells", from: { row: r1, column: "missing" }, to: { row: r1, column: "a" } },
        ],
      });

      expect(cells()).toEqual(before);
    });
  });

  describe("dispose", () => {
    test("disposes the column and row lists", () => {
      table.dispose();

      expect(table.columns.value).toEqual([]);
      expect(table.rows.value).toEqual([]);
    });
  });
});
