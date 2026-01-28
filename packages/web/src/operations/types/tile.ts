import type { ClientTile } from "api/types/tiles";
import type { Operation } from "./base";

export interface TileUpdateData {
  tileId: string;
  changes: Partial<ClientTile> & {
    sectionId?: string | null;
    beforeId?: string | null;
  };
}

export interface TileUpdateOperation extends Operation<
  "tile.update",
  TileUpdateData
> {}

export interface TileDeleteData {
  tileIds: string[];
}

export interface TileDeleteInverse {
  snapshots: ClientTile[];
}

export interface TileDeleteOperation extends Operation<
  "tile.delete",
  TileDeleteData,
  TileDeleteInverse
> {}

export interface TileCreateData {
  tileId: string;
  sectionId: string | null;
}

export interface TileCreateInverse {
  tileId: string;
}

export interface TileCreateOperation extends Operation<
  "tile.create",
  TileCreateData,
  TileCreateInverse
> {}

export type TileOperation =
  | TileUpdateOperation
  | TileDeleteOperation
  | TileCreateOperation;
