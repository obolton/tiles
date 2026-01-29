import client from "@/api/client";
import { getBookmarksStore } from "./cache";

export async function setIsBookmarked(pageId: string, isBookmarked: boolean) {
  if (isBookmarked) {
    await client.bookmarks.create.mutate({ pageId });
  } else {
    await client.bookmarks.delete.mutate({ pageId });
  }

  try {
    const bookmarks = getBookmarksStore();
    await bookmarks.put(isBookmarked, pageId);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache bookmark:", error);
    }
  }
}

export async function getIsBookmarked(pageId: string) {
  try {
    const bookmarks = getBookmarksStore();
    const cached = await bookmarks.get(pageId);
    if (typeof cached === "boolean") {
      return cached;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to read cached bookmark:", error);
    }
  }

  const result = await client.bookmarks.isBookmarked.query({ pageId });

  try {
    const bookmarks = getBookmarksStore();
    void bookmarks.put(result, pageId);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache bookmark:", error);
    }
  }

  return result;
}
