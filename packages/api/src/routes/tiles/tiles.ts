import prisma from "@/database/prisma.ts";
import type {
  ReorderTileSchema,
  DeleteTileSchema,
  ResizeTileSchema,
} from "./schema.ts";
import type { TileType } from "@prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma.ts";

export async function reorderTile({
  pageId,
  id,
  collectionId,
  afterId,
}: ReorderTileSchema) {
  return prisma.$transaction(async (transaction) => {
    const {
      parentCollectionId: previousCollectionId,
      position: previousPosition,
    } = await transaction.tile.findUniqueOrThrow({
      where: { pageId, id },
      select: { parentCollectionId: true, position: true },
    });

    const afterTile = afterId
      ? await transaction.tile.findUniqueOrThrow({
          where: { pageId, id: afterId, parentCollectionId: collectionId },
          select: { position: true },
        })
      : null;

    const position = afterTile ? afterTile.position + 1 : 0;

    // Move within same collection
    if (collectionId === previousCollectionId) {
      // Move down collection
      if (position > previousPosition) {
        await Promise.all([
          transaction.tile.updateMany({
            where: {
              pageId,
              parentCollectionId: collectionId,
              id: { not: id },
              position: { gt: previousPosition, lte: position },
            },
            data: { position: { decrement: 1 } },
          }),
          transaction.tile.update({
            where: { pageId, id },
            data: { position },
          }),
        ]);
        // Move up collection
      } else {
        await Promise.all([
          transaction.tile.updateMany({
            where: {
              pageId,
              parentCollectionId: collectionId,
              id: { not: id },
              position: { gte: position, lt: previousPosition },
            },
            data: { position: { increment: 1 } },
          }),
          transaction.tile.update({
            where: { pageId, id },
            data: { position },
          }),
        ]);
      }

      // Move to new collection
    } else {
      await Promise.all([
        // Remove position from old collection
        transaction.tile.updateMany({
          where: {
            pageId,
            parentCollectionId: previousCollectionId,
            id: { not: id },
            position: { gt: previousPosition },
          },
          data: { position: { decrement: 1 } },
        }),

        // Create space in new collection
        transaction.tile.updateMany({
          where: {
            pageId,
            parentCollectionId: collectionId,
            id: { not: id },
            position: { gte: position },
          },
          data: { position: { increment: 1 } },
        }),

        // Move item to collection
        transaction.tile.update({
          where: { pageId, id },
          data: { parentCollectionId: collectionId, position },
          select: { id: true },
        }),
      ]);
    }

    return {
      id,
      pageId,
      fromPosition: previousPosition,
      toPosition: position,
      collectionId: collectionId,
    };
  });
}

export async function resizeTile({
  pageId,
  id,
  width,
  height,
  x,
  y,
}: ResizeTileSchema) {
  return prisma.tile.update({
    where: { pageId, id },
    data: {
      width,
      height,
      x,
      y,
    },
    select: {
      id: true,
      pageId: true,
      width: true,
      height: true,
      x: true,
      y: true,
    },
  });
}

export async function deleteTile({ pageId, id }: DeleteTileSchema) {
  return prisma.$transaction(async (transaction) => {
    const { parentCollectionId, position } = await transaction.tile.delete({
      where: { pageId, id },
      select: { parentCollectionId: true, position: true },
    });
    await transaction.tile.updateMany({
      where: {
        pageId,
        parentCollectionId,
        position: { gt: position },
      },
      data: { position: { decrement: 1 } },
    });
    return { id, pageId };
  });
}

type CreateTilePlacement = {
  pageId: string;
  parentCollectionId: string;
  type: TileType;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  imageTileId?: string;
  mapTileId?: string;
  textTileId?: string;
  pageLinkTileId?: string;
  linkTileId?: string;
  videoTileId?: string;
  collectionId?: string;
  tableId?: string;
};

export async function createTilePlacement(
  {
    pageId,
    parentCollectionId,
    type,
    width = 1,
    height = 1,
    x,
    y,
    imageTileId,
    mapTileId,
    textTileId,
    pageLinkTileId,
    linkTileId,
    videoTileId,
    tableId,
  }: CreateTilePlacement,
  transaction: PrismaTransactionClient,
) {
  const position = await transaction.tile.count({
    where: { pageId },
  });

  const { id: placementId, ...tile } = await transaction.tile.create({
    data: {
      pageId,
      parentCollectionId,
      type,
      position,
      width,
      height,
      x,
      y,
      imageTileId,
      mapTileId,
      textTileId,
      pageLinkTileId,
      linkTileId,
      videoTileId,
      tableId,
    },
    select: {
      id: true,
      position: true,
      width: true,
      height: true,
      x: true,
      y: true,
      parentCollectionId: true,
    },
  });
  return { ...tile, placementId };
}
