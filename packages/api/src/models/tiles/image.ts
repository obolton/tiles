import { TileType } from "@prisma/client";
import type { ImageTileSchema } from "./schema.ts";
import prisma from "../../database/prisma.ts";

export async function createOrUpdateImageTile({
  id,
  pageId,
  imageKey,
}: ImageTileSchema) {
  return prisma.imageTile.upsert({
    where: {
      id,
    },
    create: {
      tile: {
        create: {
          pageId,
          type: TileType.IMAGE,
        },
      },
      imageKey,
    },
    update: {
      imageKey,
    },
    select: {
      tile: {
        select: {
          id: true,
          type: true,
          image: {
            select: {
              id: true,
              imageKey: true,
            },
          },
        },
      },
    },
  });
}
