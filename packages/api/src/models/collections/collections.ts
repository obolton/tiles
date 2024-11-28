import prisma from "@/database/prisma.ts";
import { COLLECTION_TILE_FIELDS } from "../tiles/collection.ts";
import type {
  CreateCollectionSchema,
  DeleteCollectionSchema,
  AddToCollectionSchema,
  RemoveFromCollectionSchema,
} from "./schema.ts";

export async function createCollection(
  userId: string,
  { title, items = [] }: CreateCollectionSchema,
) {
  return await prisma.collection.create({
    data: {
      userId,
      title,
      items: {
        connect: items.map((id) => ({ id })),
      },
    },
    select: {
      id: true,
      title: true,
    },
  });
}

export async function deleteCollection({ id }: DeleteCollectionSchema) {
  return await prisma.collection.delete({
    where: { id },
    select: {
      id: true,
    },
  });
}

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
