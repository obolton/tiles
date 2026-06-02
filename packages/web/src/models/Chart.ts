import * as Y from "yjs";
import Tile, { type CreateTileInput } from "./Tile";
import Series from "@/models/Series";
import Collection from "@/collaboration/Collection";
import type { Reactive } from "@/utils/reactivity";
import type { ChartType, Property } from "@/models/Series";
import type Page from "@/models/Page";
import type { ClientChartTile } from "api/types/tiles";
import type { ColorFill, GradientFill } from "@/components/fills/types";

export { Series };
export type { ChartType, Property };

export interface CreateChartInput extends Omit<CreateTileInput, "type"> {
  tableId: string;
  label?: Property | null;
  columns?: Property[];
}

export default class Chart extends Tile {
  readonly type = "CHART";

  readonly tableId: Reactive<string>;
  readonly label: Reactive<Property | null>;
  readonly series: Collection<Series>;

  static createMap(
    properties: Omit<CreateChartInput, "parentId" | "beforeId" | "columns">,
  ): Y.Map<unknown> {
    const { tableId, label, ...baseProps } = properties;
    const map = super.buildBaseMap({ ...baseProps, type: "CHART" });
    map.set("tableId", tableId);
    map.set("label", label ?? null);
    map.set("series", new Y.Map<Y.Map<unknown>>());
    return map;
  }

  static async create(page: Page, data: CreateChartInput): Promise<Chart> {
    const { parentId, beforeId, columns, ...rest } = data;
    const map = Chart.createMap(rest);
    const chart = page.createTile(map, { parentId, beforeId }) as Chart;
    for (const column of columns ?? []) {
      chart.series.create(
        Series.createMap({ type: "BAR", column, fill: null }),
      );
    }
    chart.editor.addTile(chart);
    return chart;
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.tableId = this.binding.field("tableId", "");
    this.label = this.binding.field("label", null);
    this.series = new Collection(
      map.get("series") as Y.Map<Y.Map<unknown>>,
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
    this.series.create(Series.createMap({ type: "BAR", column, fill: null }));
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
