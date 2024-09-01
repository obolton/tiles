import { TileType, type Prisma } from "@prisma/client";
import type {
  CreateHeadingTileSchema,
  UpdateHeadingTileSchema,
} from "./schema.ts";

export async function createHeadingTile(
  tx: Prisma.TransactionClient,
  { pageId, heading: { content } }: CreateHeadingTileSchema,
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
  { id, heading: { content } }: UpdateHeadingTileSchema,
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
