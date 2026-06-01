import type { SetPagePropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetPagePropertiesAction> = async (
  editor,
  { changes },
) => {
  const { page } = editor;

  if (changes.title !== undefined) {
    page.title.value = changes.title;
    document.title = `${changes.title} - Tiles`;
  }
  if (changes.published !== undefined) {
    page.isPublished.value = changes.published;
  }
  if (changes.folderId !== undefined) {
    page.folderId.value = changes.folderId;
  }
};

export const executors = {
  "page.setProperties": setProperties,
} as const;
