import prisma from "@/database/prisma.ts";
import { COLLECTION_TILE_FIELDS } from "../tiles/collection.ts";
import type {
  AddToCollectionSchema,
  RemoveFromCollectionSchema,
} from "./schema.ts";

export async function addToCollection({
  collectionId,
  tileId,
}: AddToCollectionSchema) {
  return prisma.$transaction(async (tx) => {
    const position = await tx.tile.count({
      where: { parentCollectionId: collectionId },
    });
    return await tx.collection.update({
      where: { id: collectionId },
      data: {
        items: {
          connect: {
            id: tileId,
            position,
          },
        },
      },
      select: COLLECTION_TILE_FIELDS,
    });
  });
}

export async function removeFromCollection({
  id,
  collectionId,
}: RemoveFromCollectionSchema) {
  return prisma.$transaction(async (tx) => {
    const { position } = await tx.tile.update({
      where: { id },
      data: { parentCollectionId: null },
      select: { position: true },
    });
    await tx.tile.updateMany({
      where: {
        parentCollectionId: collectionId,
        position: { gt: position },
      },
      data: { position: { decrement: 1 } },
    });
  });
}
