import client from "@/api/client";
import type { SetPagePropertiesAction } from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetPagePropertiesAction> = async (
  editor,
  { changes },
) => {
  const { page } = editor;

  if (changes.title !== undefined) {
    page.title.value = changes.title;
  }
  if (changes.backgroundColor !== undefined) {
    page.backgroundColor.value = changes.backgroundColor;
  }
  if (changes.font !== undefined) {
    page.font.value = changes.font;
  }
  if (changes.published !== undefined) {
    page.isPublished.value = changes.published;
  }
  if (changes.folderId !== undefined) {
    page.folderId.value = changes.folderId;
  }
  if (changes.themeId !== undefined) {
    page.themeId.value = changes.themeId;
  }

  // Persist to server
  await client.pages.update.mutate({
    pageId: page.id,
    ...changes,
  });
};

export const executors = {
  "page.setProperties": setProperties,
} as const;
