import { TileType, type Prisma } from "@prisma/client";
import type { TextTileSchema } from "./schema.ts";

export async function createTextTile(
  tx: Prisma.TransactionClient,
  pageId: string,
  { text: { content, theme, hue } }: TextTileSchema,
  position: number,
) {
  const textTile = await tx.textTile.create({
    data: {
      content,
      theme,
      hue,
    },
    select: {
      id: true,
    },
  });
  return tx.tile.create({
    data: {
      pageId,
      type: TileType.TEXT,
      position,
      columns: 1,
      rows: 1,
      textTileId: textTile.id,
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
          theme: true,
          hue: true,
        },
      },
    },
  });
}

export async function updateTextTile(
  tx: Prisma.TransactionClient,
  id: string,
  { text: { content, theme, hue } }: TextTileSchema,
) {
  return tx.tile.update({
    where: {
      id,
    },
    data: {
      text: {
        update: {
          content,
          theme,
          hue,
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
      text: {
        select: {
          content: true,
          theme: true,
          hue: true,
        },
      },
    },
  });
}
