import type { ClientTextTile } from "api/types/tiles";
import type { Action } from "./base";

export interface SetTextPropertiesData {
  tileId: string;
  changes: Partial<Pick<ClientTextTile, "content" | "align">>;
}

export interface SetTextPropertiesAction
  extends Action<"text.setProperties", SetTextPropertiesData> {}

export type TextAction = SetTextPropertiesAction;
