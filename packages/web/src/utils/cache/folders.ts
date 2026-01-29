import type { SchemaDefinition } from "@/utils/idb";

export interface CachedFolder {
  id: string;
  name: string;
}

export interface FoldersMeta {
  nextCursor: string | null;
  cachedAt: Date;
}

export const foldersSchema = {
  folders: { keyPath: "id" },
  foldersMeta: {},
} as const satisfies SchemaDefinition;
