import * as Y from "yjs";
import { DEFAULT_COLUMN_WIDTH } from "doc/tiles/table";
import { YMapBinding } from "@/collaboration/YMapBinding";
import type { Reactive } from "@/utils/reactivity";
import type { Fill } from "@/components/fills/types";

export default class Column {
  readonly id: string;
  readonly title: Reactive<string | null>;
  readonly width: Reactive<number>;
  readonly background: Reactive<Fill | null>;
  private readonly binding: YMapBinding;

  constructor(id: string, map: Y.Map<unknown>) {
    this.id = id;
    this.binding = new YMapBinding(map);
    this.title = this.binding.field("title", null);
    this.width = this.binding.field("width", DEFAULT_COLUMN_WIDTH);
    this.background = this.binding.field("background", null);
  }

  serialize() {
    return {
      id: this.id,
      title: this.title.value,
      width: this.width.value,
      background: this.background.value,
    };
  }

  dispose() {
    this.binding.dispose();
  }
}
