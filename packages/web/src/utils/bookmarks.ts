import client from "@/api/client";
import { bookmarksCache } from "./cache";
import { flag } from "./reactivity";

export const isBookmarked = flag(false);

export async function initBookmarkStatus(pageId: string) {
  isBookmarked.value = await getIsBookmarked(pageId);
}

export async function setIsBookmarked(
  pageId: string,
  isBookmarked: boolean,
): Promise<void> {
  if (isBookmarked) {
    await client.bookmarks.create.mutate({ pageId });
    await bookmarksCache.append([{ id: pageId }]);
  } else {
    await client.bookmarks.delete.mutate({ pageId });
    await bookmarksCache.delete([pageId]);
  }
}

export async function getIsBookmarked(pageId: string): Promise<boolean> {
  // Check in-memory first
  if (bookmarksCache.getById(pageId)) {
    return true;
  }

  // If cache is warm, item not found means not bookmarked
  if (bookmarksCache.isWarm) {
    return false;
  }

  // Cache not populated - fetch from API
  const result = await client.bookmarks.isBookmarked.query({ pageId });

  if (result) {
    await bookmarksCache.append([{ id: pageId }]);
  }

  return result;
}
