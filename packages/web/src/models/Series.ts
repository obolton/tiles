import * as Y from "yjs";
import { buildSeriesMap, type SeriesMapInput } from "doc/tiles/series";
import { YMapBinding } from "@/collaboration/YMapBinding";
import type { Reactive } from "reactivity";
import type { ColorFill, GradientFill } from "@/components/fills/types";
import type { Property } from "doc/types/chart";
import type { ChartSeriesType } from "doc/types/tiles/chart";

export type ChartType = ChartSeriesType;

export default class Series {
  readonly id: string;
  readonly type: Reactive<ChartType>;
  readonly column: Reactive<Property>;
  readonly fill: Reactive<ColorFill | GradientFill | null>;
  private readonly binding: YMapBinding;

  static createMap(order: string, input: SeriesMapInput): Y.Map<unknown> {
    return buildSeriesMap(order, input);
  }

  constructor(id: string, map: Y.Map<unknown>) {
    this.id = id;
    this.binding = new YMapBinding(map);
    this.type = this.binding.field("type", "BAR");
    this.column = this.binding.field("column", { id: "", title: null });
    this.fill = this.binding.field("fill", null);
  }

  dispose() {
    this.binding.dispose();
  }
}
