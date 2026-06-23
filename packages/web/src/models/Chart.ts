import * as Y from "yjs";
import Tile from "./Tile";
import { buildChartMap, type ChartMapInput } from "doc/tiles/chart";
import Series from "@/models/Series";
import SharedList from "@/collaboration/SharedList";
import { createId } from "doc/id";
import { orderBetween, orderedEntries } from "doc/placement/ordering";
import type { Reactive } from "@/utils/reactivity";
import type { ChartType } from "@/models/Series";
import type Page from "@/models/Page";
import type { ClientChartTile } from "api/types/tiles";
import type { ColorFill, GradientFill } from "@/components/fills/types";
import type { Property } from "doc/types/chart";

export interface CreateChartInput extends ChartMapInput {
  columns?: Property[];
}

export default class Chart extends Tile {
  readonly type = "CHART";

  readonly tableId: Reactive<string>;
  readonly label: Reactive<Property | null>;
  readonly series: SharedList<Series>;
  private readonly seriesMap: Y.Map<Y.Map<unknown>>;

  static createMap(
    properties: Omit<CreateChartInput, "parentId" | "beforeId" | "columns">,
  ): Y.Map<unknown> {
    return buildChartMap(properties);
  }

  static async create(page: Page, data: CreateChartInput): Promise<Chart> {
    const { parentId, beforeId, columns, ...rest } = data;
    const map = Chart.createMap(rest);
    const chart = page.createTile(map, { parentId, beforeId }) as Chart;
    for (const column of columns ?? []) {
      chart.addSeries(column);
    }
    chart.editor.addTile(chart);
    return chart;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.tableId = this.binding.field("tableId", "");
    this.label = this.binding.field("label", null);
    this.seriesMap = map.get("series") as Y.Map<Y.Map<unknown>>;
    this.series = new SharedList(
      this.seriesMap,
      (id, map) => new Series(id, map),
    );
  }

  serialize(): ClientChartTile {
    return {
      ...super.serialize(),
      type: "CHART",
      tableId: this.tableId.value,
      label: this.label.value,
      series: this.series.value.map((s) => ({
        id: s.id,
        type: s.type.value,
        column: s.column.value,
        fill: s.fill.value,
      })),
    };
  }

  setLabel(property: Property | null) {
    this.label.value = property;
  }

  addSeries(column: Property) {
    const order = orderBetween(orderedEntries(this.seriesMap), null);
    this.seriesMap.set(
      createId(),
      Series.createMap(order, { type: "BAR", column, fill: null }),
    );
  }

  setSeriesChartType(id: string, type: ChartType) {
    this.series.get(id).type.value = type;
  }

  setSeriesFill(id: string, fill: ColorFill | GradientFill | null) {
    this.series.get(id).fill.value = fill;
  }

  deleteSeries(id: string) {
    this.series.remove(id);
  }

  dispose() {
    this.series.dispose();
    super.dispose();
  }
}
