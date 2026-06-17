import * as Y from "yjs";
import { DEFAULT_ROW_HEIGHT } from "doc/tiles/table";
import { YMapBinding } from "@/collaboration/YMapBinding";
import type { Reactive } from "@/utils/reactivity";
import type { Fill } from "@/components/fills/types";
import type { RichText } from "@/utils/richText/types";

export type CellValue = RichText | string | null;

export default class Row {
  readonly id: string;
  readonly height: Reactive<number>;
  readonly background: Reactive<Fill | null>;
  private readonly binding: YMapBinding;
  private readonly cells: Y.Map<CellValue>;

  constructor(id: string, map: Y.Map<unknown>) {
    this.id = id;
    this.binding = new YMapBinding(map);
    this.height = this.binding.field("height", DEFAULT_ROW_HEIGHT);
    this.background = this.binding.field("background", null);

    const cells = map.get("cells");
    if (!(cells instanceof Y.Map)) {
      throw new Error("Table row missing cells");
    }
    this.cells = cells as Y.Map<CellValue>;
  }

  cell(columnId: string): CellValue {
    return this.cells.get(columnId) ?? null;
  }

  get data(): Record<string, CellValue> {
    const data: Record<string, CellValue> = {};
    for (const [columnId, value] of this.cells) {
      data[columnId] = value;
    }
    return data;
  }

  serialize() {
    return {
      id: this.id,
      height: this.height.value,
      background: this.background.value,
      data: this.data,
    };
  }

  dispose() {
    this.binding.dispose();
  }
}
