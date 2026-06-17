import { describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Table from "@/models/Table";
import { buildTableMap } from "doc/tiles/table";
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
});
