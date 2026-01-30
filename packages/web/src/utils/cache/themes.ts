import type { SchemaDefinition } from "@/utils/idb";
import type { Theme } from "api/types/themes";

export type CachedTheme = Theme;

export interface ThemesMeta {
  cachedAt: Date;
}

export const themesSchema = {
  themes: { keyPath: "id" },
  themesMeta: {},
} as const satisfies SchemaDefinition;
