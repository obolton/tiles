import type { SchemaDefinition } from "@/utils/idb";

export interface CachedUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
}

export interface UsersMeta {
  nextCursor: string | null;
  cachedAt: Date;
}

export const usersSchema = {
  users: { keyPath: "id" },
  usersMeta: {},
} as const satisfies SchemaDefinition;
