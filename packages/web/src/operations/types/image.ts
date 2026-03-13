import type { ClientImageTile } from "api/types/tiles";
import type { Action } from "./base";
import type { TileActionData } from "./tile";

export interface SetImagePropertiesData extends TileActionData {
  changes: Partial<Pick<ClientImageTile, "text" | "originX" | "originY">>;
}

export interface SetImagePropertiesAction extends Action<
  "image.setProperties",
  SetImagePropertiesData
> {}

export type ImageAction = SetImagePropertiesAction;
