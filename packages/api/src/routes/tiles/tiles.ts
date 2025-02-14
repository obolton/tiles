import prisma from "@/database/prisma.ts";
import type {
  MoveTileSchema,
  DeleteTileSchema,
  ResizeTileSchema,
} from "./schema.ts";
import type { TileType } from "@prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma.ts";

export async function moveTile({
  pageId,
  id,
  collectionId,
  afterId,
}: MoveTileSchema) {
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
            parentCollectionId: null,
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
  columns,
  rows,
}: ResizeTileSchema) {
  return prisma.tile.update({
    where: { pageId, id },
    data: {
      columns,
      rows,
    },
    select: {
      id: true,
      pageId: true,
      columns: true,
      rows: true,
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
  parentCollectionId?: string;
  type: TileType;
  columns?: number;
  rows?: number;
  imageTileId?: string;
  mapTileId?: string;
  textTileId?: string;
  eventTileId?: string;
  pageLinkTileId?: string;
  linkTileId?: string;
  videoTileId?: string;
  collectionId?: string;
};

export async function createTilePlacement(
  {
    pageId,
    parentCollectionId,
    type,
    columns = 1,
    rows = 1,
    imageTileId,
    mapTileId,
    textTileId,
    eventTileId,
    pageLinkTileId,
    linkTileId,
    videoTileId,
    collectionId,
  }: CreateTilePlacement,
  transaction: PrismaTransactionClient,
) {
  const position = await transaction.tile.count({
    where: { pageId },
  });
  const placement = await transaction.tile.create({
    data: {
      pageId,
      parentCollectionId,
      type,
      position,
      columns,
      rows,
      imageTileId,
      mapTileId,
      textTileId,
      eventTileId,
      pageLinkTileId,
      linkTileId,
      videoTileId,
      collectionId,
    },
    select: {
      id: true,
      position: true,
      columns: true,
      rows: true,
      parentCollectionId: true,
    },
  });
  return {
    placementId: placement.id,
    position: placement.position,
    columns: placement.columns,
    rows: placement.rows,
    parentCollectionId: placement.parentCollectionId,
  };
}
