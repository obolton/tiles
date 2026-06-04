import * as Y from "yjs";
import type { DropdownOption } from "../types/dropdown";

export interface DropdownMapInput {
  title?: string | null;
  options: DropdownOption[];
}

export function buildDropdownMap(input: DropdownMapInput): Y.Map<unknown> {
  const map = new Y.Map<unknown>();
  map.set("title", input.title ?? null);
  map.set("options", input.options);
  return map;
}
