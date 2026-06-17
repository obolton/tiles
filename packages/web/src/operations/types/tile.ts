import type { ClientTile } from "api/types/tiles";
import type { Action } from "./base";

export interface TileActionData {
  tileId: string;
}

export type TilePropertyChanges = Partial<ClientTile> & {
  sectionId?: string | null;
  beforeId?: string | null;
  themeId?: string | null;
};

export interface SetTilePropertiesData extends TileActionData {
  changes: TilePropertyChanges;
}

export interface SetTilePropertiesAction extends Action<
  "tile.setProperties",
  SetTilePropertiesData
> {}

export type TileAction = SetTilePropertiesAction;
