import { TileType, type Prisma } from "@prisma/client";
import type { HeadingTileSchema } from "./schema.ts";

export async function createHeadingTile(
  tx: Prisma.TransactionClient,
  pageId: string,
  { heading: { content } }: HeadingTileSchema,
  position: number,
) {
  const headingTile = await tx.headingTile.create({
    data: {
      content,
    },
    select: {
      id: true,
    },
  });
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.HEADING,
      position,
      columns: 1,
      rows: 1,
      headingTileId: headingTile.id,
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      heading: {
        select: {
          content: true,
        },
      },
    },
  });
}

export async function updateHeadingTile(
  tx: Prisma.TransactionClient,
  id: string,
  { heading: { content } }: HeadingTileSchema,
) {
  return tx.tile.update({
    where: {
      id,
    },
    data: {
      heading: {
        update: {
          content,
        },
      },
    },
    select: {
      id: true,
      pageId: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      heading: {
        select: {
          content: true,
        },
      },
    },
  });
}
