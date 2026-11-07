import * as Y from "yjs";
import type { PlacementInput } from "doc/tiles/base";
import Tile from "./Tile";
import Table from "./Table";
import { buildChartMap, type ChartMapInput } from "doc/tiles/chart";
import { buildTableMap } from "doc/tiles/table";
import Series from "@/models/Series";
import SharedList from "@/collaboration/SharedList";
import { createId } from "doc/id";
import { orderBetween, orderedEntries } from "doc/placement/ordering";
import { isNumericColumn, MAX_DEFAULT_SERIES } from "@/utils/charts";
import { combine, type Reactive } from "reactivity";
import type Page from "@/models/Page";
import type Column from "@/models/Column";
import type { Property } from "doc/types/chart";
import type { ChartSeriesType } from "doc/types/enums";

export interface CreateChartInput extends ChartMapInput {
  columns?: Property[];
}

export interface CreateChartFromTableInput {
  /** The columns to chart as series. Defaults to the table's numeric columns. */
  columns?: readonly Column[];
  /** Where the chart goes. Defaults to directly after the table. */
  placement?: PlacementInput;
}

/** The data a chart starts from when there is no table to chart. */
const SAMPLE_TABLE = {
  columns: [{ title: "Month" }, { title: "Sunny days" }, { title: "Rainy days" }],
  rows: [
    { cells: ["Jan", "8", "14"] },
    { cells: ["Feb", "10", "12"] },
    { cells: ["Mar", "13", "11"] },
    { cells: ["Apr", "16", "9"] },
    { cells: ["May", "19", "8"] },
    { cells: ["Jun", "22", "6"] },
  ],
  height: 12,
};

export function toProperty(column: Column): Property {
  return { id: column.id, title: column.title.value };
}

export default class Chart extends Tile {
  readonly type = "CHART";

  readonly tableId: Reactive<string>;
  /** The table the chart draws from, or `null` once it has been deleted. */
  readonly table: Reactive<Table | null>;
  readonly label: Reactive<Property | null>;
  readonly series: SharedList<Series>;
  private readonly seriesMap: Y.Map<Y.Map<unknown>>;

  static createMap(
    properties: Omit<CreateChartInput, keyof PlacementInput | "columns">,
  ): Y.Map<unknown> {
    return buildChartMap(properties);
  }

  static async create(page: Page, data: CreateChartInput): Promise<Chart> {
    const { parentId, beforeId, at, columns, ...rest } = data;
    const map = Chart.createMap(rest);
    const chart = page.createTile(map, { parentId, beforeId, at }) as Chart;
    for (const column of columns ?? []) {
      chart.addSeries(column);
    }
    chart.editor.addTile(chart);
    return chart;
  }

  /**
   * Creates a chart of a table's numeric columns, labelled by its first text column. The first
   * series is drawn as bars and the rest as lines, so they stay distinguishable.
   */
  static async createFromTable(
    table: Table,
    { columns, placement = table.placementAfter() }: CreateChartFromTableInput = {},
  ): Promise<Chart> {
    const all = table.columns.value;
    const numeric = new Set(
      all
        .filter((column) => isNumericColumn(table.getColumnData(column.id).value))
        .map((c) => c.id),
    );
    const charted =
      columns ?? all.filter((column) => numeric.has(column.id)).slice(0, MAX_DEFAULT_SERIES);
    const chartedIds = new Set(charted.map((column) => column.id));
    const unused = all.filter((column) => !chartedIds.has(column.id));
    const label = unused.find((column) => !numeric.has(column.id)) ?? unused[0] ?? null;

    return Chart.create(table.page, {
      ...placement,
      tableId: table.id,
      sizing: "FOUR_THREE",
      label: label && toProperty(label),
      columns: charted.map(toProperty),
    });
  }

  /** Inserts a table of sample data at the placement, with a chart of it directly after. */
  static createWithSampleData(page: Page, placement: PlacementInput): Promise<Chart> {
    const table = page.createTile(buildTableMap(SAMPLE_TABLE), placement) as Table;
    return Chart.createFromTable(table);
  }

  constructor(page: Page, map: Y.Map<unknown>) {
    super(page, map);

    this.tableId = this.binding.field("tableId", "");
    this.label = this.binding.field("label", null);
    this.seriesMap = map.get("series") as Y.Map<Y.Map<unknown>>;
    this.series = new SharedList(this.seriesMap, (id, map) => new Series(id, map));

    // The derive dedupes, so subscribers only hear when the table appears or disappears.
    this.table = combine({ id: this.tableId, index: page.index }, ({ id, index }) => {
      const tile = index.get(id);
      return tile instanceof Table ? tile : null;
    }).derive((table) => table);
  }

  addSeries(
    column: Property,
    type: ChartSeriesType = this.series.value.length === 0 ? "BAR" : "LINE",
  ) {
    const order = orderBetween(orderedEntries(this.seriesMap), null);
    this.seriesMap.set(createId(), Series.createMap(order, { type, column, fill: null }));
  }

  dispose() {
    this.series.dispose();
    super.dispose();
  }
}
