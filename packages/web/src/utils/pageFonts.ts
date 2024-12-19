import type { ClientTile } from "@/types/tiles";

export function getTileFonts(tiles: ClientTile[]) {
  return new Set(
    tiles
      .filter((tile) => tile.type === "PAGE_LINK")
      .map((tile) => tile.linkedPage?.font)
      .filter((font) => typeof font === "string"),
  );
}
