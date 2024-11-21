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
    const position = await tx.collectionItem.count({
      where: { collectionId },
    });
    // TODO: Enforce tile types
    const tile = await tx.tile.findUniqueOrThrow({
      where: { id: tileId },
      select: {
        imageTileId: true,
        videoTileId: true,
        textTileId: true,
        linkTileId: true,
        pageLinkTileId: true,
        eventTileId: true,
        mapTileId: true,
      },
    });
    return await tx.collection.update({
      where: { id: collectionId },
      data: {
        items: {
          create: {
            ...tile,
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
