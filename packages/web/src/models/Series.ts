import * as Y from "yjs";
import { YMapBinding } from "@/collaboration/YMapBinding";
import type { Reactive } from "@/utils/reactivity";
import type { ColorFill, GradientFill } from "@/components/fills/types";

export interface Property {
  id: string;
  title: string | null;
}

export type ChartType = "BAR" | "LINE" | "AREA";

export interface CreateSeriesInput {
  type: ChartType;
  column: Property;
  fill: ColorFill | GradientFill | null;
}

export default class Series {
  readonly id: string;
  readonly type: Reactive<ChartType>;
  readonly column: Reactive<Property>;
  readonly fill: Reactive<ColorFill | GradientFill | null>;
  private readonly binding: YMapBinding;

  static createMap(input: CreateSeriesInput): Y.Map<unknown> {
    const map = new Y.Map<unknown>();
    map.set("type", input.type);
    map.set("column", input.column);
    map.set("fill", input.fill);
    return map;
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
