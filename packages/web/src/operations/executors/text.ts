import Text from "@/models/Text";
import type { SetTextPropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetTextPropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const tile = editor.getTileAs(tileId, Text);

  if (changes.content !== undefined) {
    tile.content.value = changes.content;
    // Clear editor state so it reinitializes from content
    tile.state.value = null;
  }
  if (changes.align !== undefined) {
    await tile.setVerticalAlignment(changes.align);
  }
};

export const executors = {
  "text.setProperties": setProperties,
} as const;
