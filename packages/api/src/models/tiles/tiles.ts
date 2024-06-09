import prisma from "../../database/prisma.ts";
import { createImageTile, updateImageTile } from "./image.ts";
import { createTextTile, updateTextTile } from "./text.ts";
import { createPlaceTile, updatePlaceTile } from "./place.ts";
import type {
  CreateTileSchema,
  UpdateTileSchema,
  MoveTileSchema,
  DeleteTileSchema,
} from "./schema.ts";

export async function createTile(properties: CreateTileSchema) {
  return prisma.$transaction(async (tx) => {
    const position = await tx.tile.count({
      where: { pageId: properties.pageId },
    });
    switch (properties.type) {
      case "IMAGE":
        return createImageTile(tx, properties, position);
      case "TEXT":
        return createTextTile(tx, properties, position);
      case "PLACE":
        return createPlaceTile(tx, properties, position);
    }
  });
}

export async function updateTile(properties: UpdateTileSchema) {
  switch (properties.type) {
    case "IMAGE":
      return updateImageTile(prisma, properties);
    case "TEXT":
      return updateTextTile(prisma, properties);
    case "PLACE":
      return updatePlaceTile(prisma, properties);
  }
}

export async function moveTile({ id, pageId, position }: MoveTileSchema) {
  return prisma.$transaction(async (tx) => {
    const tile = await tx.tile.findUniqueOrThrow({
      where: { pageId, id },
      select: { position: true },
    });
    const oldPosition = tile.position;
    if (oldPosition === position) {
      return;
    } else if (position > oldPosition) {
      await prisma.tile.updateMany({
        where: {
          pageId,
          id: { not: id },
          position: { gt: oldPosition, lte: position },
        },
        data: { position: { decrement: 1 } },
      });
    } else {
      await prisma.tile.updateMany({
        where: {
          pageId,
          id: { not: id },
          position: { gte: position, lt: oldPosition },
        },
        data: { position: { increment: 1 } },
      });
    }
    await prisma.tile.update({
      where: { pageId, id },
      data: { position },
    });
    return {
      id,
      fromPosition: oldPosition,
      toPosition: position,
    };
  });
}

export async function deleteTile({ id }: DeleteTileSchema) {
  return prisma.tile.delete({ where: { id } });
}
