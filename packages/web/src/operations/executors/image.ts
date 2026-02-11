import Image from "@/models/Image";
import type { SetImagePropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetImagePropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const tile = editor.page.getTile(tileId, Image);

  if (changes.originX !== undefined || changes.originY !== undefined) {
    tile.origin.value = {
      x: changes.originX ?? tile.origin.value.x,
      y: changes.originY ?? tile.origin.value.y,
    };
  }
  if (changes.text !== undefined) {
    tile.text.value = changes.text;
  }
};

export const executors = {
  "image.setProperties": setProperties,
} as const;
