import * as Y from "yjs";
import { DEFAULT_ROW_HEIGHT } from "doc/tiles/table";
import { getBackgroundStyle } from "@/utils/backgrounds";
import { YMapBinding } from "@/collaboration/YMapBinding";
import type { Reactive } from "carillon";
import type { StyleDeclaration } from "jsx/html-attributes";
import type { Fill } from "@/components/fills/types";
import type { RichText } from "doc/types/richText";

export type CellValue = RichText | string | null;

export default class Row {
  readonly id: string;
  readonly height: Reactive<number>;
  readonly background: Reactive<Fill | null>;
  readonly style: Reactive<StyleDeclaration | undefined>;
  private readonly binding: YMapBinding;
  private readonly cells: Y.Map<CellValue>;

  constructor(id: string, map: Y.Map<unknown>) {
    this.id = id;
    this.binding = new YMapBinding(map);
    this.height = this.binding.field("height", DEFAULT_ROW_HEIGHT);
    this.background = this.binding.field("background", null);
    this.style = this.background.derive(getBackgroundStyle);

    const cells = map.get("cells");
    if (!(cells instanceof Y.Map)) {
      throw new Error("Table row missing cells");
    }
    this.cells = cells as Y.Map<CellValue>;
  }

  cell(columnId: string): CellValue {
    return this.cells.get(columnId) ?? null;
  }

  dispose() {
    this.binding.dispose();
  }
}
