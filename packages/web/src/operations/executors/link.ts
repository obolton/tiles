import Link from "@/models/Link";
import type { SetLinkPropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetLinkPropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const tile = editor.page.getTile(tileId, Link);

  if (changes.url !== undefined) {
    tile.url.value = changes.url;
  }
  if (changes.title !== undefined) {
    tile.title.value = changes.title;
  }
  if (changes.description !== undefined) {
    tile.description.value = changes.description;
  }
  if (changes.siteName !== undefined) {
    tile.siteName.value = changes.siteName;
  }
  if (changes.imageId !== undefined) {
    tile.imageId.value = changes.imageId;
    tile.background.value = changes.imageId
      ? { type: "image", imageId: changes.imageId }
      : null;
  }
};

export const executors = {
  "link.setProperties": setProperties,
} as const;
