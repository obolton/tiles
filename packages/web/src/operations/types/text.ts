import type { TextTile } from "doc/types/tiles";
import type { Action } from "./base";
import type { TileActionData } from "./tile";

export interface SetTextPropertiesData extends TileActionData {
  changes: Partial<Pick<TextTile, "content" | "align">>;
}

export interface SetTextPropertiesAction extends Action<
  "text.setProperties",
  SetTextPropertiesData
> {}

export type TextAction = SetTextPropertiesAction;
