import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import Chart from "@/models/Chart";
import Editor from "@/editor/Editor";
import { PAGE } from "@/test/fixtures/Page";
import type { ColorFill } from "@/components/fills/types";

const editor = Editor.init(PAGE, new Y.Doc());
const { page } = editor;

function createChart(): Chart {
  const chart = page.createTile(
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

describe("Chart", () => {
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

  test("serialize", () => {
    const chart = createChart();
    const [first, second] = chart.series.value;

    expect(chart.serialize()).toMatchObject({
      type: "CHART",
      tableId: "table-id",
      label: { id: "col-1", title: "Revenue" },
      series: [
        {
          id: first?.id,
          type: "BAR",
          column: { id: "col-2", title: "Expenses" },
          fill: null,
        },
        {
          id: second?.id,
          type: "BAR",
          column: { id: "col-3", title: "Profit" },
          fill: null,
        },
      ],
    });
  });

  describe("setLabel", () => {
    test("updates the label column", () => {
      const chart = createChart();
      const property = { id: "col-3", title: "Profit" };

      chart.setLabel(property);

      expect(chart.label.value).toEqual(property);
    });

    test("clears the label column", () => {
      const chart = createChart();

      chart.setLabel(null);

      expect(chart.label.value).toBeNull();
    });
  });

  describe("addSeries", () => {
    test("appends a new series", () => {
      const chart = createChart();

      chart.addSeries({ id: "col-4", title: "Growth" });

      expect(chart.series.value).toHaveLength(3);
      const added = chart.series.value[2];
      expect(added?.id).toBeTruthy();
      expect(added?.type.value).toBe("BAR");
      expect(added?.column.value).toEqual({ id: "col-4", title: "Growth" });
      expect(added?.fill.value).toBeNull();
    });
  });

  describe("setSeriesChartType", () => {
    test("updates the series chart type", () => {
      const chart = createChart();
      const id = chart.series.value[0]!.id;

      chart.setSeriesChartType(id, "LINE");

      expect(chart.series.get(id).type.value).toBe("LINE");
    });

    test("throws an error for an invalid series ID", () => {
      const chart = createChart();

      expect(() => chart.setSeriesChartType("invalid-id", "LINE")).toThrow(
        "Item not found: invalid-id",
      );
    });
  });

  describe("setSeriesFill", () => {
    test("updates the series fill", () => {
      const chart = createChart();
      const id = chart.series.value[0]!.id;
      const fill: ColorFill = { type: "color", color: "ffff00008080" };

      chart.setSeriesFill(id, fill);

      expect(chart.series.get(id).fill.value).toEqual(fill);
    });

    test("clears the series fill", () => {
      const chart = createChart();
      const id = chart.series.value[0]!.id;

      chart.setSeriesFill(id, null);

      expect(chart.series.get(id).fill.value).toBeNull();
    });

    test("throws an error for an invalid series ID", () => {
      const chart = createChart();

      expect(() => chart.setSeriesFill("invalid-id", null)).toThrow("Item not found: invalid-id");
    });
  });

  describe("deleteSeries", () => {
    test("removes the series from the list", () => {
      const chart = createChart();
      const [first, second] = chart.series.value;

      chart.deleteSeries(first!.id);

      expect(chart.series.value).toHaveLength(1);
      expect(chart.series.value[0]?.id).toBe(second!.id);
      expect(() => chart.series.get(first!.id)).toThrow(`Item not found: ${first!.id}`);
    });
  });
});
