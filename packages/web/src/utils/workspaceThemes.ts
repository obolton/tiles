import client from "@/api/client";
import Theme from "@/models/Theme";
import { themesCache, getWorkspaceId } from "./cache";

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

export async function createWorkspaceTheme(): Promise<Theme> {
  const workspaceId = getWorkspaceId();
  const result = await client.themes.create.mutate({
    workspaceId,
    name: "Untitled",
    colors: { text: "141414141414", accent: "3b3b82f682f6" },
    fonts: { heading: "MODERN", body: "MODERN", code: "CODE" },
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
