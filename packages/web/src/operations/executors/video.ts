import Video from "@/models/Video";
import type { SetVideoPropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetVideoPropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const tile = editor.getTileAs(tileId, Video);

  if (changes.title !== undefined) {
    tile.title.value = changes.title;
  }
};

export const executors = {
  "video.setProperties": setProperties,
} as const;
