import Tile from "./Tile";
import {
  reactive,
  array,
  type Reactive,
  type ReactiveArray,
} from "@/utils/reactivity";
import client from "@/api/client";
import type Page from "@/models/Page";
import type { ClientChartTile } from "api/types/tiles";
import type { ColorFill, GradientFill } from "@/components/fills/types";
import type { AppRouterInputs } from "@/api/client";

export interface Property {
  id: string;
  title: string | null;
}

export type ChartType = "BAR" | "LINE" | "AREA";

export interface Series {
  id: string;
  type: Reactive<ChartType>;
  column: Reactive<Property>;
  fill: Reactive<ColorFill | GradientFill | null>;
}

export default class Chart extends Tile {
  readonly type = "CHART";

  readonly tableId: string;
  readonly label: Reactive<Property | null>;
  readonly series: ReactiveArray<Series>;

  static async create(
    page: Page,
    data: Omit<AppRouterInputs["charts"]["create"], "pageId">,
  ) {
    const properties = await client.charts.create.mutate({
      pageId: page.id,
      ...data,
    });
    const chart = new Chart(page, properties);
    const { editor } = chart;
    editor.addTile(chart, properties.sectionId, data.beforeId);
    editor.recordOperation({
      apply: { type: "tile.restore", data: { snapshots: [properties] } },
      reverse: { type: "tile.delete", data: { tileIds: [properties.id] } },
    });
  }

  constructor(page: Page, properties: ClientChartTile) {
    super(page, properties);

    const { tableId, label, series } = properties;
    this.tableId = tableId;
    this.label = reactive(label);
    this.series = array<Series>(
      series.map(({ id, type, column, fill }) => ({
        id,
        type: reactive(type),
        column: reactive(column),
        fill: reactive(fill),
      })),
    );
  }

  serialize(): ClientChartTile {
    return {
      ...super.serialize(),
      type: "CHART",
      tableId: this.tableId,
      label: this.label.value,
      series: this.series.value.map((s) => ({
        id: s.id,
        type: s.type.value,
        column: s.column.value,
        fill: s.fill.value,
      })),
    };
  }

  private update(
    properties: Omit<AppRouterInputs["charts"]["update"], "pageId" | "id">,
  ) {
    return client.charts.update.mutate({
      ...properties,
      pageId: this.page.id,
      id: this.id,
    });
  }

  // Label

  setLabel(property: Property | null) {
    const previousLabel = this.label.value;
    this.label.value = property;

    this.editor.recordOperation({
      apply: {
        type: "chart.setProperties",
        data: { tileId: this.id, changes: { label: property } },
      },
      reverse: {
        type: "chart.setProperties",
        data: { tileId: this.id, changes: { label: previousLabel } },
      },
    });

    return this.update({ labelColumnId: property?.id });
  }

  // Series

  async addSeries(columnId: string) {
    const series = await client.charts.addSeries.mutate({
      pageId: this.page.id,
      chartId: this.id,
      columnId,
    });
    const { id, type, column, fill } = series;
    this.series.push({
      id,
      type: reactive(type),
      column: reactive(column),
      fill: reactive(fill),
    });

    this.editor.recordOperation({
      apply: {
        type: "chart.addSeries",
        data: { tileId: this.id, series: { id, type, column, fill } },
      },
      reverse: {
        type: "chart.removeSeries",
        data: { tileId: this.id, seriesId: id },
      },
    });
  }

  private updateSeries(
    properties: Omit<
      AppRouterInputs["charts"]["updateSeries"],
      "pageId" | "chartId"
    >,
  ) {
    return client.charts.updateSeries.mutate({
      ...properties,
      pageId: this.page.id,
      chartId: this.id,
    });
  }

  setSeriesChartType(id: string, type: ChartType) {
    const series = this.series.find((s) => s.id === id);
    if (!series) {
      throw new Error(`Invalid series ID: ${id}`);
    }

    const previousType = series.type.value;
    series.type.value = type;

    this.editor.recordOperation({
      apply: {
        type: "chart.setSeriesProperties",
        data: { tileId: this.id, seriesId: id, changes: { type } },
      },
      reverse: {
        type: "chart.setSeriesProperties",
        data: {
          tileId: this.id,
          seriesId: id,
          changes: { type: previousType },
        },
      },
    });

    return this.updateSeries({ seriesId: id, type });
  }

  setSeriesFill(id: string, fill: GradientFill | ColorFill | null) {
    const series = this.series.find((s) => s.id === id);
    if (!series) {
      throw new Error(`Invalid series ID: ${id}`);
    }

    const previousFill = series.fill.value;
    series.fill.value = fill;

    this.editor.recordOperation({
      apply: {
        type: "chart.setSeriesProperties",
        data: { tileId: this.id, seriesId: id, changes: { fill } },
      },
      reverse: {
        type: "chart.setSeriesProperties",
        data: {
          tileId: this.id,
          seriesId: id,
          changes: { fill: previousFill },
        },
      },
    });

    return this.updateSeries({ seriesId: id, fill });
  }

  deleteSeries(seriesId: string) {
    const series = this.series.find((s) => s.id === seriesId);

    this.series.value = this.series.value.filter((s) => s.id !== seriesId);

    if (series) {
      this.editor.recordOperation({
        apply: {
          type: "chart.removeSeries",
          data: { tileId: this.id, seriesId },
        },
        reverse: {
          type: "chart.restoreSeries",
          data: {
            tileId: this.id,
            series: {
              id: series.id,
              type: series.type.value,
              column: series.column.value,
              fill: series.fill.value,
            },
          },
        },
      });
    }

    return client.charts.deleteSeries.mutate({
      pageId: this.page.id,
      chartId: this.id,
      seriesId,
    });
  }
}
