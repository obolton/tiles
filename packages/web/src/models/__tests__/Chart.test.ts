import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import Chart from "@/models/Chart";
import Editor from "@/editor/Editor";
import { PAGE } from "@/test/fixtures/Page";

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
});
