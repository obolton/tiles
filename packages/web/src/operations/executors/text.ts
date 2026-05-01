import Text from "@/models/Text";
import type { SetTextPropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetTextPropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const tile = editor.page.getTile(tileId, Text);

  if (changes.content !== undefined) {
    tile.content.value = changes.content;
  }
  if (changes.align !== undefined) {
    tile.align.value = changes.align;
  }
};

export const executors = {
  "text.setProperties": setProperties,
} as const;
