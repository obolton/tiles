import { TileType, type Prisma } from "@prisma/client";
import { cleanUserInput } from "../../utils/text.ts";
import type { ImageTileSchema } from "./schema.ts";

export async function createImageTile(
  tx: Prisma.TransactionClient,
  pageId: string,
  { image: { imageKey, caption } }: ImageTileSchema,
  position: number,
) {
  const imageTile = await tx.imageTile.create({
    data: {
      imageKey,
      caption: caption ? cleanUserInput(caption) : null,
    },
    select: {
      id: true,
    },
  });
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.IMAGE,
      position,
      columns: 1,
      rows: 1,
      imageTileId: imageTile.id,
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
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
  id: string,
  { image: { imageKey, caption } }: ImageTileSchema,
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
      pageId: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      image: {
        select: {
          imageKey: true,
          caption: true,
        },
      },
    },
  });
}
