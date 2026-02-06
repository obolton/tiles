import type { ClientTile } from "api/types/tiles";
import type { Action } from "./base";

export type TilePropertyChanges = Partial<ClientTile> & {
  sectionId?: string | null;
  beforeId?: string | null;
  themeId?: string | null;
};

export interface SetTilePropertiesData {
  tileId: string;
  changes: TilePropertyChanges;
}

export interface SetTilePropertiesAction extends Action<
  "tile.setProperties",
  SetTilePropertiesData
> {}

// Delete tiles by ID
export interface DeleteTilesData {
  tileIds: string[];
}

export interface DeleteTilesAction extends Action<
  "tile.delete",
  DeleteTilesData
> {}

// Restore tiles from snapshots
export interface RestoreTilesData {
  snapshots: ClientTile[];
}

export interface RestoreTilesAction extends Action<
  "tile.restore",
  RestoreTilesData
> {}

export type TileAction =
  | SetTilePropertiesAction
  | DeleteTilesAction
  | RestoreTilesAction;
