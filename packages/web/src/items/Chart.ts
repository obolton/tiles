import Tile from "./Tile";
import {
  reactive,
  array,
  type Reactive,
  type ReactiveArray,
} from "@/utils/reactivity";
import client from "@/api/client";
import type Editor from "@/editor/Editor";
import type { ClientChartTile } from "api/src/types/tiles";
import type { Background } from "@/components/backgrounds/types";
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
}

export default class Chart extends Tile {
  readonly type = "CHART";

  readonly tableId: string;
  readonly label: Reactive<Property | null>;
  readonly series: ReactiveArray<Series>;
  readonly background: Reactive<ClientChartTile["background"]>;

  constructor(editor: Editor, properties: ClientChartTile) {
    super(editor, properties);

    const { tableId, label, series, background } = properties;
    this.tableId = tableId;
    this.label = reactive(label);
    this.series = array<Series>(
      series.map(({ id, type, column }) => ({
        id,
        type: reactive(type),
        column: reactive(column),
      })),
    );
    this.background = reactive(background);
  }

  private update(
    properties: Omit<AppRouterInputs["charts"]["update"], "pageId" | "id">,
  ) {
    return client.charts.update.mutate({
      ...properties,
      pageId: this.editor.pageId,
      id: this.id,
    });
  }

  setBackground(background: Background | null) {
    this.background.value = background;
    return this.update({ background });
  }

  // Label

  setLabel(property: Property | null) {
    this.label.value = property;
    return this.update({ labelColumnId: property?.id });
  }

  // Series

  async addSeries(columnId: string) {
    const series = await client.charts.addSeries.mutate({
      pageId: this.editor.pageId,
      chartId: this.id,
      columnId,
    });
    const { id, type, column } = series;
    this.series.push({
      id,
      type: reactive(type),
      column: reactive(column),
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
      pageId: this.editor.pageId,
      chartId: this.id,
    });
  }

  setSeriesChartType(id: string, type: ChartType) {
    const series = this.series.find((s) => s.id === id);
    if (!series) {
      throw new Error(`Invalid series ID: ${id}`);
    }
    series.type.value = type;
    return this.updateSeries({ seriesId: id, type });
  }

  deleteSeries(seriesId: string) {
    this.series.value = this.series.value.filter(
      (series) => series.id !== seriesId,
    );
    return client.charts.deleteSeries.mutate({
      pageId: this.editor.pageId,
      chartId: this.id,
      seriesId,
    });
  }
}
