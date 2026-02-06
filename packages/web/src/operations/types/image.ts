import type { ClientImageTile } from "api/types/tiles";
import type { Action } from "./base";

export interface SetImagePropertiesData {
  tileId: string;
  changes: Partial<Pick<ClientImageTile, "text" | "originX" | "originY">>;
}

export interface SetImagePropertiesAction extends Action<
  "image.setProperties",
  SetImagePropertiesData
> {}

export type ImageAction = SetImagePropertiesAction;
