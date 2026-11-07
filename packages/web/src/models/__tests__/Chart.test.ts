import { beforeEach, describe, expect, test, vi } from "vitest";
import Chart from "@/models/Chart";
import Table from "@/models/Table";
import Text from "@/models/Text";
import { createEditor } from "@/test/editor";
import { buildTableMap } from "doc/tiles/table";
import type Editor from "@/editor/Editor";

vi.mock("@/collaboration/PageCollaboration", () => import("@/test/mocks/PageCollaboration"));

let editor: Editor;

function createChart(): Chart {
  const chart = editor.page.createTile(
    Chart.createMap({
      tableId: "table-id",
      label: { id: "col-1", title: "Revenue" },
    }),
    {},
  ) as Chart;
  chart.addSeries({ id: "col-2", title: "Expenses" });
  chart.addSeries({ id: "col-3", title: "Profit" });
  return chart;
}

function createTable(): Table {
  return editor.page.createTile(
    buildTableMap({
      columns: [
        { id: "month", title: "Month" },
        { id: "sunny", title: "Sunny days" },
        { id: "rainy", title: "Rainy days" },
        { id: "notes", title: "Notes" },
      ],
      rows: [
        { cells: ["Jan", "8", "14", "Cold"] },
        { cells: ["Feb", "10", "12", null] },
        { cells: ["Mar", "13", null, null] },
      ],
    }),
    {},
  ) as Table;
}

describe("Chart", () => {
  beforeEach(() => {
    editor = createEditor();
  });

  test("maps properties to reactive values", () => {
    const chart = createChart();

    expect(chart.type).toBe("CHART");
    expect(chart.tableId.value).toBe("table-id");
    expect(chart.label.value).toEqual({ id: "col-1", title: "Revenue" });
    expect(chart.series.value).toHaveLength(2);
    expect(chart.series.value[0]?.type.value).toBe("BAR");
    expect(chart.series.value[0]?.column.value).toEqual({
      id: "col-2",
      title: "Expenses",
    });
    expect(chart.series.value[0]?.fill.value).toBeNull();
  });

  describe("addSeries", () => {
    test("appends a new series", () => {
      const chart = createChart();

      chart.addSeries({ id: "col-4", title: "Growth" });

      expect(chart.series.value).toHaveLength(3);
      const added = chart.series.value[2];
      expect(added?.id).toEqual(expect.any(String));
      expect(added?.column.value).toEqual({ id: "col-4", title: "Growth" });
      expect(added?.fill.value).toBeNull();
    });

    test("draws the first series as bars and later ones as lines", () => {
      const chart = createChart();

      chart.addSeries({ id: "col-4", title: "Growth" });

      expect(chart.series.value.map((series) => series.type.value)).toEqual([
        "BAR",
        "LINE",
        "LINE",
      ]);
    });

    test("uses the given series type", () => {
      const chart = createChart();

      chart.addSeries({ id: "col-4", title: "Growth" }, "AREA");

      expect(chart.series.value[2]?.type.value).toBe("AREA");
    });
  });

  describe("table", () => {
    test("resolves the table and becomes null when it is deleted", () => {
      const table = createTable();
      const chart = editor.page.createTile(Chart.createMap({ tableId: table.id }), {}) as Chart;
      const seen: (Table | null)[] = [];
      chart.table.subscribe((reactive) => seen.push(reactive.value));

      expect(chart.table.value).toBe(table);

      editor.page.placement.remove([table]);

      expect(chart.table.value).toBeNull();
      expect(seen).toEqual([null]);
    });

    test("resolves a table restored by undo", () => {
      const table = createTable();
      const chart = editor.page.createTile(Chart.createMap({ tableId: table.id }), {}) as Chart;
      chart.table.subscribe(() => {});
      editor.undoManager?.stopCapturing();

      editor.page.placement.remove([table]);
      editor.undo();

      expect(chart.table.value).toBeInstanceOf(Table);
      expect(chart.table.value?.id).toBe(table.id);
    });

    test("ignores edits to other tiles", () => {
      const table = createTable();
      const chart = editor.page.createTile(Chart.createMap({ tableId: table.id }), {}) as Chart;
      const text = editor.page.createTile(Text.createMap({}), {}) as Text;
      const notifications = vi.fn();
      chart.table.subscribe(notifications);

      text.sizing.value = "SQUARE";
      table.updateCell({ rowId: table.rows.value[0]!.id, columnId: "sunny", value: "9" });

      expect(notifications).not.toHaveBeenCalled();
    });

    test("is null for a tile that is not a table", () => {
      const text = editor.page.createTile(Text.createMap({}), {}) as Text;
      const chart = editor.page.createTile(Chart.createMap({ tableId: text.id }), {}) as Chart;

      expect(chart.table.value).toBeNull();
    });
  });

  describe("createFromTable", () => {
    test("charts the numeric columns, labelled by the first text column", async () => {
      const table = createTable();

      const chart = await Chart.createFromTable(editor.page, table);

      expect(chart.tableId.value).toBe(table.id);
      expect(chart.sizing.value).toBe("FOUR_THREE");
      expect(chart.label.value).toEqual({ id: "month", title: "Month" });
      expect(chart.series.value.map((series) => series.column.value)).toEqual([
        { id: "sunny", title: "Sunny days" },
        { id: "rainy", title: "Rainy days" },
      ]);
      expect(chart.series.value.map((series) => series.type.value)).toEqual(["BAR", "LINE"]);
    });

    test("places the chart directly after the table and selects it", async () => {
      const table = createTable();
      const text = editor.page.createTile(Text.createMap({}), {});

      const chart = await Chart.createFromTable(editor.page, table);

      expect(editor.page.tiles.value.map((tile) => tile.id)).toEqual([table.id, chart.id, text.id]);
      expect(Array.from(editor.selection)).toEqual([chart.id]);
    });

    test("charts only the given columns", async () => {
      const table = createTable();
      const rainy = table.columns.get("rainy");

      const chart = await Chart.createFromTable(editor.page, table, { columns: [rainy] });

      expect(chart.series.value.map((series) => series.column.value.id)).toEqual(["rainy"]);
      expect(chart.label.value?.id).toBe("month");
    });

    test("labels by the first unused column when every column is numeric", async () => {
      const table = editor.page.createTile(
        buildTableMap({
          columns: [{ id: "a" }, { id: "b" }],
          rows: [{ cells: ["1", "2"] }],
        }),
        {},
      ) as Table;

      const chart = await Chart.createFromTable(editor.page, table);
      expect(chart.label.value).toBeNull();
      expect(chart.series.value.map((series) => series.column.value.id)).toEqual(["a", "b"]);

      const single = await Chart.createFromTable(editor.page, table, {
        columns: [table.columns.get("b")],
      });
      expect(single.label.value?.id).toBe("a");
    });

    test("accepts an explicit placement", async () => {
      const table = createTable();
      const text = editor.page.createTile(Text.createMap({}), {});

      const chart = await Chart.createFromTable(editor.page, table, {
        placement: { parentId: null, beforeId: null },
      });

      expect(editor.page.tiles.value.map((tile) => tile.id)).toEqual([table.id, text.id, chart.id]);
    });
  });
});
