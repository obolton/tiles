import prisma from "@/database/prisma.ts";
import type { CollectionItem } from "@prisma/client";
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

function getRelationColumn(
  type: AddToCollectionSchema["type"],
): keyof Omit<
  CollectionItem,
  "id" | "createdAt" | "updatedAt" | "collectionId" | "position"
> {
  switch (type) {
    case "IMAGE":
      return "imageTileId";
    case "VIDEO":
      return "videoTileId";
    case "TEXT":
      return "textTileId";
    case "PLACE":
      return "placeTileId";
    case "LINK":
      return "linkTileId";
    case "PAGE_LINK":
      return "pageLinkTileId";
    case "EVENT":
      return "eventTileId";
  }
}

export async function addToCollection({
  collectionId,
  type,
  itemId,
}: AddToCollectionSchema) {
  return prisma.$transaction(async (tx) => {
    const position = await tx.collectionItem.count({
      where: { collectionId },
    });
    return await tx.collectionItem.create({
      data: {
        collectionId,
        [getRelationColumn(type)]: itemId,
        position,
      },
      select: {
        id: true,
      },
    });
  });
}

export async function removeFromCollection({
  id,
  collectionId,
}: RemoveFromCollectionSchema) {
  return prisma.$transaction(async (tx) => {
    const { position } = await tx.collectionItem.delete({
      where: { id, collectionId },
      select: { position: true },
    });
    await tx.collectionItem.updateMany({
      where: {
        collectionId,
        position: { gt: position },
      },
      data: { position: { decrement: 1 } },
    });
  });
}
