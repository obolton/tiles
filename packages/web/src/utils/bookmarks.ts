import client from "@/api/client";
import { openDatabase, getRecord, putRecord } from "./idb";

const BOOKMARKS_DB_VERSION = 1;
const BOOKMARKS_DB_NAME = "bookmarks";
const BOOKMARKS_STORE_NAME = "bookmarks";

let database: IDBDatabase | null = null;

async function getBookmarksDatabase() {
  if (import.meta.env.SSR) {
    return null;
  }
  if (database) {
    return database;
  }
  database = await openDatabase(
    BOOKMARKS_DB_NAME,
    BOOKMARKS_DB_VERSION,
    upgrade,
  );
  return database;
}

function upgrade(db: IDBDatabase) {
  db.createObjectStore(BOOKMARKS_STORE_NAME);
}

export async function setIsBookmarked(pageId: string, isBookmarked: boolean) {
  if (isBookmarked) {
    await client.bookmarks.create.mutate({ pageId });
  } else {
    await client.bookmarks.delete.mutate({ pageId });
  }

  const db = await getBookmarksDatabase();
  if (db) {
    await putRecord(db, BOOKMARKS_STORE_NAME, pageId, isBookmarked);
  }
}

export async function getIsBookmarked(pageId: string) {
  const db = await getBookmarksDatabase();
  if (!db) {
    return false;
  }
  const bookmark = await getRecord<boolean>(db, BOOKMARKS_STORE_NAME, pageId);
  if (typeof bookmark === "boolean") {
    return bookmark;
  }
  const result = await client.bookmarks.isBookmarked.query({ pageId });
  void putRecord(db, BOOKMARKS_STORE_NAME, pageId, result);
  return result;
}
