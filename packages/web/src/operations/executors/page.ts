import { themesCache } from "@/utils/cache";
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
    page.theme.value = changes.themeId
      ? themesCache.getById(changes.themeId)
      : null;
  }
  if (changes.width !== undefined) {
    page.width.value = changes.width;
  }
  if (changes.alignment !== undefined) {
    page.alignment.value = changes.alignment;
  }
  if (
    changes.dockTopHeight !== undefined ||
    changes.dockBottomHeight !== undefined ||
    changes.dockLeftWidth !== undefined ||
    changes.dockRightWidth !== undefined
  ) {
    const prev = page.dockSizes.value;
    page.dockSizes.value = {
      TOP: changes.dockTopHeight ?? prev.TOP,
      BOTTOM: changes.dockBottomHeight ?? prev.BOTTOM,
      LEFT: changes.dockLeftWidth ?? prev.LEFT,
      RIGHT: changes.dockRightWidth ?? prev.RIGHT,
    };
  }
};

export const executors = {
  "page.setProperties": setProperties,
} as const;
