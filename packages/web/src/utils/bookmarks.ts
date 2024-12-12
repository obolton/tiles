import client from "@/api/client";
import { openDatabase, getRecord, putRecord } from "./idb";

const BOOKMARKS_DB_VERSION = 1;
const BOOKMARKS_DB_NAME = "bookmarks";
const BOOKMARKS_STORE_NAME = "bookmarks";
const BOOKMARKS_DB = await openDatabase(
  BOOKMARKS_DB_NAME,
  BOOKMARKS_DB_VERSION,
  upgrade,
);

function upgrade(db: IDBDatabase) {
  db.createObjectStore(BOOKMARKS_STORE_NAME);
}

export async function setIsBookmarked(pageId: string, isBookmarked: boolean) {
  if (isBookmarked) {
    await client.bookmarks.create.mutate({ pageId });
  } else {
    await client.bookmarks.delete.mutate({ pageId });
  }
  putRecord(BOOKMARKS_DB, BOOKMARKS_STORE_NAME, pageId, isBookmarked);
}

export async function getIsBookmarked(pageId: string) {
  const bookmark = await getRecord<boolean>(
    BOOKMARKS_DB,
    BOOKMARKS_STORE_NAME,
    pageId,
  );
  if (typeof bookmark === "boolean") {
    return bookmark;
  }
  const result = await client.bookmarks.isBookmarked.query({ pageId });
  putRecord(BOOKMARKS_DB, BOOKMARKS_STORE_NAME, pageId, result);
}
