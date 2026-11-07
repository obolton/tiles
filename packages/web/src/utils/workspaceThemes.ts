import client from "@/api/client";
import Theme from "@/models/Theme";
import { DEFAULT_THEME_VALUES } from "@/utils/themes";
import { themesCache, getWorkspaceId } from "./cache";
import type { ThemeData } from "@/models/Theme";

export async function getWorkspaceThemes() {
  const cached = await themesCache.getCached();
  if (cached) {
    return cached.items;
  }

  const workspaceId = getWorkspaceId();
  const result = await client.themes.list.query({ workspaceId });
  const themes = result.map((data) => new Theme(data));
  await themesCache.set(themes);

  return themes;
}

export async function invalidateWorkspaceThemes(): Promise<void> {
  await themesCache.invalidate();
}

/** Creates a theme from the given theme's values, or the defaults. */
export async function createWorkspaceTheme(from: ThemeData | null = null): Promise<Theme> {
  const workspaceId = getWorkspaceId();
  const { background, colors, fonts } = from ?? DEFAULT_THEME_VALUES;
  const result = await client.themes.create.mutate({
    workspaceId,
    name: "New theme",
    background,
    colors,
    fonts,
  });
  const theme = new Theme(result);
  await themesCache.upsert(theme);
  return theme;
}

export async function duplicateWorkspaceTheme(source: Theme): Promise<Theme> {
  const result = await source.duplicate();
  const theme = new Theme(result);
  await themesCache.upsert(theme);
  return theme;
}

export async function deleteWorkspaceTheme(theme: Theme): Promise<void> {
  await theme.delete();
  await themesCache.delete([theme.id]);
}
