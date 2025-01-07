import prisma from "@/database/prisma.ts";
import type {
  MoveTileSchema,
  DeleteTileSchema,
  ResizeTileSchema,
} from "./schema.ts";
import type { TileType } from "@prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma.ts";

export async function moveTile({ pageId, id, position }: MoveTileSchema) {
  return prisma.$transaction(async (transaction) => {
    const { parentCollectionId, position: oldPosition } =
      await transaction.tile.findUniqueOrThrow({
        where: { pageId, id },
        select: { parentCollectionId: true, position: true },
      });

    if (oldPosition === position) {
      return { id, pageId, fromPosition: oldPosition, toPosition: position };
    } else if (position > oldPosition) {
      await transaction.tile.updateMany({
        where: {
          pageId,
          parentCollectionId,
          id: { not: id },
          position: { gt: oldPosition, lte: position },
        },
        data: { position: { decrement: 1 } },
      });
    } else {
      await transaction.tile.updateMany({
        where: {
          pageId,
          parentCollectionId,
          id: { not: id },
          position: { gte: position, lt: oldPosition },
        },
        data: { position: { increment: 1 } },
      });
    }

    await transaction.tile.update({
      where: { pageId, id },
      data: { position },
    });

    return {
      id,
      pageId,
      fromPosition: oldPosition,
      toPosition: position,
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
    },
  });
  return {
    placementId: placement.id,
    position: placement.position,
    columns: placement.columns,
    rows: placement.rows,
  };
}
