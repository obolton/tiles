import { afterEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import Chart from "@/models/Chart";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { CHART_TILE } from "@/test/fixtures/Tile";
import type { Fill } from "@/components/fills/types";

vi.mock("@/api/client", () => ({
  default: {
    charts: {
      update: {
        mutate: vi.fn(),
      },
      addSeries: {
        mutate: vi.fn(),
      },
      updateSeries: {
        mutate: vi.fn(),
      },
      deleteSeries: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Chart", () => {
  const editor = Editor.init(PAGE, new Y.Doc());
  const updateMock = vi.mocked(client.charts.update.mutate);
  const addSeriesMock = vi.mocked(client.charts.addSeries.mutate);
  const updateSeriesMock = vi.mocked(client.charts.updateSeries.mutate);
  const deleteSeriesMock = vi.mocked(client.charts.deleteSeries.mutate);

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("serialize", () => {
    const data = { ...CHART_TILE, sectionId: null };
    const chart = new Chart(editor.page, data);

    expect(chart.serialize()).toEqual(data);
  });

  test("maps properties to reactive values", () => {
    const chart = new Chart(editor.page, CHART_TILE);

    expect(chart.type).toBe("CHART");
    expect(chart.tableId).toBe(CHART_TILE.tableId);
    expect(chart.label.value).toEqual(CHART_TILE.label);
    expect(chart.background.value).toBe(CHART_TILE.background);
    expect(chart.series.value).toHaveLength(2);
    expect(chart.series.value[0]?.id).toBe("series-1");
    expect(chart.series.value[0]?.type.value).toBe("BAR");
    expect(chart.series.value[0]?.column.value).toEqual({
      id: "col-2",
      title: "Expenses",
    });
    expect(chart.series.value[0]?.fill.value).toEqual({
      type: "color",
      color: "ffff40400000",
    });
    expect(chart.series.value[1]?.id).toBe("series-2");
    expect(chart.series.value[1]?.type.value).toBe("LINE");
  });

  describe("setLabel", () => {
    test("updates the label column", async () => {
      const chart = new Chart(editor.page, CHART_TILE);
      const property = { id: "col-3", title: "Profit" };

      await chart.setLabel(property);

      expect(chart.label.value).toEqual(property);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: CHART_TILE.id,
        labelColumnId: property.id,
      });
    });

    test("clears the label column", async () => {
      const chart = new Chart(editor.page, CHART_TILE);

      await chart.setLabel(null);

      expect(chart.label.value).toBeNull();
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: CHART_TILE.id,
        labelColumnId: undefined,
      });
    });
  });

  describe("addSeries", () => {
    test("adds a new series", async () => {
      const chart = new Chart(editor.page, CHART_TILE);
      const fill: Fill = { type: "color", color: "ffff00004040" };
      const newSeries = {
        id: "series-3",
        type: "AREA" as const,
        fill,
        column: { id: "col-4", title: "Growth" },
      };

      addSeriesMock.mockResolvedValue(newSeries);

      await chart.addSeries("col-4");

      expect(addSeriesMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        chartId: CHART_TILE.id,
        columnId: "col-4",
      });
      expect(chart.series.value).toHaveLength(3);
      expect(chart.series.value[2]?.id).toBe("series-3");
      expect(chart.series.value[2]?.type.value).toBe("AREA");
      expect(chart.series.value[2]?.column.value).toEqual({
        id: "col-4",
        title: "Growth",
      });
      expect(chart.series.value[2]?.fill.value).toEqual(fill);
    });
  });

  describe("setSeriesChartType", () => {
    test("updates the series chart type", async () => {
      const chart = new Chart(editor.page, CHART_TILE);

      await chart.setSeriesChartType("series-1", "LINE");

      expect(chart.series.value[0]?.type.value).toBe("LINE");
      expect(updateSeriesMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        chartId: CHART_TILE.id,
        seriesId: "series-1",
        type: "LINE",
      });
    });

    test("throws an error for invalid series ID", () => {
      const chart = new Chart(editor.page, CHART_TILE);

      expect(() => chart.setSeriesChartType("invalid-id", "LINE")).toThrow(
        "Invalid series ID: invalid-id",
      );
    });
  });

  describe("setSeriesFill", () => {
    test("updates the series fill", async () => {
      const chart = new Chart(editor.page, CHART_TILE);
      const fill: Fill = { type: "color", color: "ffff00008080" };

      await chart.setSeriesFill("series-1", fill);

      expect(chart.series.value[0]?.fill.value).toEqual(fill);
      expect(updateSeriesMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        chartId: CHART_TILE.id,
        seriesId: "series-1",
        fill,
      });
    });

    test("clears the series fill", async () => {
      const chart = new Chart(editor.page, CHART_TILE);

      await chart.setSeriesFill("series-1", null);

      expect(chart.series.value[0]?.fill.value).toBeNull();
      expect(updateSeriesMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        chartId: CHART_TILE.id,
        seriesId: "series-1",
        fill: null,
      });
    });

    test("throws an error for invalid series ID", () => {
      const chart = new Chart(editor.page, CHART_TILE);

      expect(() => chart.setSeriesFill("invalid-id", null)).toThrow(
        "Invalid series ID: invalid-id",
      );
    });
  });

  describe("deleteSeries", () => {
    test("removes the series from the list", async () => {
      const chart = new Chart(editor.page, CHART_TILE);

      await chart.deleteSeries("series-1");

      expect(deleteSeriesMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        chartId: CHART_TILE.id,
        seriesId: "series-1",
      });
      expect(chart.series.value).toHaveLength(1);
      expect(chart.series.value[0]?.id).toBe("series-2");
    });
  });
});
