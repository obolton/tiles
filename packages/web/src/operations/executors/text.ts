import Text from "@/models/Text";
import type { SetTextPropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetTextPropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const tile = editor.page.getTile(tileId, Text);

  // Text content undo is handled by y-prosemirror's yUndoPlugin; only
  // non-text-content properties are routed through the OperationManager.
  if (changes.align !== undefined) {
    tile.align.value = changes.align;
  }
};

export const executors = {
  "text.setProperties": setProperties,
} as const;
