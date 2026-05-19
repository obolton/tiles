export * from "./base";
export * from "./tile";
export * from "./text";
export * from "./image";
export * from "./video";
export * from "./link";
export * from "./table";
export * from "./chart";
export * from "./page";

import type { TileAction } from "./tile";
import type { TextAction } from "./text";
import type { ImageAction } from "./image";
import type { VideoAction } from "./video";
import type { LinkAction } from "./link";
import type { TableAction } from "./table";
import type { ChartAction } from "./chart";
import type { PageAction } from "./page";

export type AnyAction =
  | TileAction
  | TextAction
  | ImageAction
  | VideoAction
  | LinkAction
  | TableAction
  | ChartAction
  | PageAction;

export type ActionType = AnyAction["type"];
