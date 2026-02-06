import client from "@/api/client";
import type { SetPagePropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetPagePropertiesAction> = async (
  editor,
  { changes },
) => {
  if (changes.title !== undefined) {
    editor.title.value = changes.title;
  }
  if (changes.backgroundColor !== undefined) {
    editor.backgroundColor.value = changes.backgroundColor;
  }
  if (changes.font !== undefined) {
    editor.font.value = changes.font;
  }
  if (changes.published !== undefined) {
    editor.isPublished.value = changes.published;
  }
  if (changes.folderId !== undefined) {
    editor.folderId.value = changes.folderId;
  }
  if (changes.themeId !== undefined) {
    editor.themeId.value = changes.themeId;
  }

  // Persist to server
  await client.pages.update.mutate({
    pageId: editor.pageId,
    ...changes,
  });
};

export const executors = {
  "page.setProperties": setProperties,
} as const;
