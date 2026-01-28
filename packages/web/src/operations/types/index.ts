export * from "./base";
export * from "./tile";
export * from "./section";
export * from "./text";
export * from "./image";
export * from "./table";
export * from "./chart";
export * from "./page";

import type { BaseOperation } from "./base";
import type { TileOperation } from "./tile";
import type { SectionOperation } from "./section";
import type { TextOperation } from "./text";
import type { ImageOperation } from "./image";
import type { TableOperation } from "./table";
import type { ChartOperation } from "./chart";
import type { PageOperation } from "./page";

export interface CompoundOperation extends BaseOperation<"compound"> {
  readonly operations: AnyOperation[];
}

export type AnyOperation =
  | TileOperation
  | SectionOperation
  | TextOperation
  | ImageOperation
  | TableOperation
  | ChartOperation
  | PageOperation
  | CompoundOperation;

export type OperationType = AnyOperation["type"];

export interface OperationHistory {
  undoStack: AnyOperation[];
  redoStack: AnyOperation[];
}
