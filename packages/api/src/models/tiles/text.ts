import { TileType } from "@prisma/client";
import type { TextTileSchema } from "./schema.ts";
import prisma from "../../database/prisma.ts";

export async function createOrUpdateTextTile({
  id,
  pageId,
  content,
}: TextTileSchema) {
  return prisma.textTile.upsert({
    where: {
      id,
    },
    create: {
      tile: {
        create: {
          pageId,
          type: TileType.TEXT,
        },
      },
      content,
    },
    update: {
      content,
    },
    select: {
      tile: {
        select: {
          id: true,
          type: true,
          text: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      },
    },
  });
}
