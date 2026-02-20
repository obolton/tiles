import type {
  SetTilePropertiesAction,
  DeleteTilesAction,
  RestoreTilesAction,
} from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetTilePropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const tile = editor.page.getTile(tileId);
  tile.applyUpdate(changes);
};

const deleteTiles: ActionExecutor<DeleteTilesAction> = async (
  editor,
  { tileIds },
) => {
  const tiles = tileIds.map((id) => editor.page.getTile(id));
  await editor.deleteTiles(tiles);
};

const restoreTiles: ActionExecutor<RestoreTilesAction> = async (
  editor,
  { snapshots },
) => {
  for (const snapshot of snapshots) {
    const tile = editor.page.createTile(snapshot);
    editor.addTile(tile, snapshot.sectionId, null, false);
  }
};

export const executors = {
  "tile.setProperties": setProperties,
  "tile.delete": deleteTiles,
  "tile.restore": restoreTiles,
} as const;
