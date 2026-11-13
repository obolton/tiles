import * as Y from "yjs";
import { buildDropdownMap, type DropdownMapInput } from "doc/tiles/dropdown";
import { YMapBinding } from "@/collaboration/YMapBinding";
import type { Reactive } from "carillon";
import type { DropdownOption } from "doc/types/dropdown";

export default class Dropdown {
  readonly id: string;
  readonly title: Reactive<string | null>;
  readonly options: Reactive<DropdownOption[]>;
  private readonly binding: YMapBinding;

  static createMap(input: DropdownMapInput): Y.Map<unknown> {
    return buildDropdownMap(input);
  }

  constructor(id: string, map: Y.Map<unknown>) {
    this.id = id;
    this.binding = new YMapBinding(map);
    this.title = this.binding.field("title", null);
    this.options = this.binding.field("options", []);
  }

  addOption(value: string) {
    this.options.value = this.options.value.concat({ value });
  }

  updateOption(index: number, value: string) {
    this.options.value = this.options.value.map((option, i) =>
      i === index ? { ...option, value } : option,
    );
  }

  removeOption(index: number) {
    this.options.value = this.options.value.toSpliced(index, 1);
  }

  reorderOptions(fromIndex: number, toIndex: number) {
    const option = this.options.value[fromIndex];
    if (!option) {
      throw new Error(`Invalid option index: ${fromIndex}`);
    }
    this.options.value = this.options.value.toSpliced(fromIndex, 1).toSpliced(toIndex, 0, option);
  }

  dispose() {
    this.binding.dispose();
  }
}
