import prisma from "@/database/prisma.ts";
import type {
  MoveTileSchema,
  DeleteTileSchema,
  ResizeTileSchema,
} from "./schema.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";
import { checkPageAccess } from "@/utils/permissions.ts";
import type { Prisma, TileType } from "@prisma/client";

export async function moveTile(
  { id, position }: MoveTileSchema,
  context: AuthenticatedRequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const {
      pageId,
      parentCollectionId,
      position: oldPosition,
    } = await tx.tile.findUniqueOrThrow({
      where: { id },
      select: { pageId: true, parentCollectionId: true, position: true },
    });

    await checkPageAccess(tx, context, pageId);

    if (oldPosition === position) {
      return { id, pageId, fromPosition: oldPosition, toPosition: position };
    } else if (position > oldPosition) {
      await prisma.tile.updateMany({
        where: {
          pageId,
          parentCollectionId,
          id: { not: id },
          position: { gt: oldPosition, lte: position },
        },
        data: { position: { decrement: 1 } },
      });
    } else {
      await prisma.tile.updateMany({
        where: {
          pageId,
          parentCollectionId,
          id: { not: id },
          position: { gte: position, lt: oldPosition },
        },
        data: { position: { increment: 1 } },
      });
    }
    await prisma.tile.update({
      where: { id },
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

export async function resizeTile({ id, columns, rows }: ResizeTileSchema) {
  return prisma.tile.update({
    where: { id },
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

export async function deleteTile({ id }: DeleteTileSchema) {
  return prisma.$transaction(async (tx) => {
    const { pageId, parentCollectionId, position } = await tx.tile.delete({
      where: { id },
      select: { pageId: true, parentCollectionId: true, position: true },
    });
    await tx.tile.updateMany({
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
  imageTileId?: string;
  mapTileId?: string;
  textTileId?: string;
  headingTileId?: string;
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
    imageTileId,
    mapTileId,
    textTileId,
    headingTileId,
    eventTileId,
    pageLinkTileId,
    linkTileId,
    videoTileId,
    collectionId,
  }: CreateTilePlacement,
  transaction: Prisma.TransactionClient,
) {
  const position = await transaction.tile.count({
    where: { pageId },
  });
  const placement = await transaction.tile.create({
    data: {
      pageId,
      type,
      position,
      columns: 1,
      rows: 1,
      imageTileId,
      mapTileId,
      textTileId,
      headingTileId,
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
