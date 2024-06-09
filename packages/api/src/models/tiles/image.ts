import { TileType, type Prisma } from "@prisma/client";
import { cleanUserInput } from "../../utils/text.ts";
import type { CreateImageTileSchema, UpdateImageTileSchema } from "./schema.ts";

export async function createImageTile(
  tx: Prisma.TransactionClient,
  { pageId, image: { imageKey, caption } }: CreateImageTileSchema,
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
          caption: caption ? cleanUserInput(caption) : null,
        },
      },
    },
    select: {
      id: true,
      type: true,
      image: {
        select: {
          imageKey: true,
          caption: true,
        },
      },
    },
  });
}

export async function updateImageTile(
  tx: Prisma.TransactionClient,
  { id, image: { imageKey, caption } }: UpdateImageTileSchema
) {
  return tx.tile.update({
    where: {
      id,
    },
    data: {
      image: {
        update: {
          imageKey,
          caption: caption ? cleanUserInput(caption) : null,
        },
      },
    },
    select: {
      id: true,
      type: true,
      image: {
        select: {
          imageKey: true,
          caption: true,
        },
      },
    },
  });
}
