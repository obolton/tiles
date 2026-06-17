import type { SetTilePropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetTilePropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const tile = editor.page.getTile(tileId);
  tile.applyUpdate(changes);
};

export const executors = {
  "tile.setProperties": setProperties,
} as const;
