import prisma from "@/database/prisma";
import { FULL_TILE_FIELDS } from "@/routes/tiles/fields";
import { formatTile } from "@/routes/tiles/tiles";
import type { ClientTile } from "@/types/tiles";

/**
 * Fetch tiles for AI context.
 */
export async function fetchTilesForContext(
  tileIds: string[],
  pageId: string,
): Promise<ClientTile[]> {
  if (tileIds.length === 0) return [];

  const tiles = await prisma.tile.findMany({
    where: {
      pageId,
      OR: [{ id: { in: tileIds } }, { sectionId: { in: tileIds } }],
    },
    select: FULL_TILE_FIELDS,
  });

  return tiles.map(formatTile).filter((tile) => tile.type !== "SECTION");
}
