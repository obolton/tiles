import type { Database, ObjectStore, SchemaDefinition } from "@/utils/idb";
import type { PageData } from "@/models/Page";
import type { TileBase } from "doc/types/tiles";

export type CachedPageData = Omit<PageData, "tiles" | "document"> & {
  tiles: TileBase[];
};

type CachedPage = Omit<PageData, "tiles" | "document">;
type CachedTile = TileBase & { pageId: string };

export const pageStoresSchema = {
  pages: { keyPath: "id" as const },
  tiles: {
    keyPath: "id" as const,
    indexes: {
      byPageId: { keyPath: "pageId" as const },
    },
  },
};

let database: Database<SchemaDefinition> | null = null;

export function initializePageCache(db: Database<SchemaDefinition>): void {
  database = db;
}

function pagesStore(): ObjectStore<CachedPage> {
  if (!database) {
    throw new Error("Page cache not initialized");
  }
  return database.store("pages");
}

function tilesStore(): ObjectStore<CachedTile> {
  if (!database) {
    throw new Error("Page cache not initialized");
  }
  return database.store("tiles");
}

export async function cachePage(pageData: PageData): Promise<void> {
  try {
    await pagesStore().put(pageData);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache page data:", error);
    }
  }
}

export async function cachePageProperties(
  props: Omit<PageData, "tiles" | "document">,
): Promise<void> {
  try {
    await pagesStore().put(props);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache page properties:", error);
    }
  }
}

export async function cacheTiles(pageId: string, tiles: TileBase[]): Promise<void> {
  try {
    await tilesStore().putMany(tiles.map((tile) => ({ ...tile, pageId })));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache tiles:", error);
    }
  }
}

export async function getCachedPageData(pageId: string): Promise<CachedPageData | null> {
  try {
    const page = await pagesStore().get(pageId);
    if (!page) {
      return null;
    }

    const cachedTiles = await tilesStore().getAllByIndex("byPageId", pageId);
    const tiles = cachedTiles.map(({ pageId: _pageId, ...tile }): TileBase => tile);

    return { ...page, tiles };
  } catch {
    return null;
  }
}

export async function invalidateCachedPageData(pageId: string): Promise<void> {
  try {
    await pagesStore().delete(pageId);
    await tilesStore().deleteByIndex("byPageId", pageId);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to invalidate cached page:", error);
    }
  }
}

export async function invalidateAllPages(): Promise<void> {
  try {
    await pagesStore().clear();
    await tilesStore().clear();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to invalidate all cached pages:", error);
    }
  }
}
