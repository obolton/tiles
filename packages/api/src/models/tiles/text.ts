import { TileType, type Prisma } from "@prisma/client";
import type { CreateTextTileSchema, UpdateTextTileSchema } from "./schema.ts";

export async function createTextTile(
  tx: Prisma.TransactionClient,
  { pageId, text: { content, hue } }: CreateTextTileSchema,
  position: number,
) {
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.TEXT,
      position,
      columns: 1,
      rows: 1,
      text: {
        create: {
          content,
          hue,
        },
      },
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      text: {
        select: {
          content: true,
          hue: true,
        },
      },
    },
  });
}

export async function updateTextTile(
  tx: Prisma.TransactionClient,
  { id, text: { content, hue } }: UpdateTextTileSchema,
) {
  return tx.tile.update({
    where: {
      id,
    },
    data: {
      text: {
        update: {
          content,
          hue,
        },
      },
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      text: {
        select: {
          content: true,
          hue: true,
        },
      },
    },
  });
}
