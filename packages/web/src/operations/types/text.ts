import type { ClientTextTile } from "api/types/tiles";
import type { Action } from "./base";
import type { TileActionData } from "./tile";

export interface SetTextPropertiesData extends TileActionData {
  changes: Partial<Pick<ClientTextTile, "content" | "align">>;
}

export interface SetTextPropertiesAction extends Action<
  "text.setProperties",
  SetTextPropertiesData
> {}

export type TextAction = SetTextPropertiesAction;
