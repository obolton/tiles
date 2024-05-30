import { TileType, type Prisma } from "@prisma/client";
import type { CreateImageTileSchema, UpdateImageTileSchema } from "./schema.ts";

export async function createImageTile(
  tx: Prisma.TransactionClient,
  { pageId, image: { imageKey } }: CreateImageTileSchema,
  position: number
) {
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.IMAGE,
      position,
      image: {
        create: {
          imageKey,
        },
      },
    },
    select: {
      id: true,
      type: true,
      image: {
        select: {
          imageKey: true,
        },
      },
    },
  });
}

export async function updateImageTile(
  tx: Prisma.TransactionClient,
  { id, image: { imageKey } }: UpdateImageTileSchema
) {
  return tx.tile.update({
    where: {
      id,
    },
    data: {
      image: {
        update: {
          imageKey,
        },
      },
    },
    select: {
      id: true,
      type: true,
      image: {
        select: {
          imageKey: true,
        },
      },
    },
  });
}
