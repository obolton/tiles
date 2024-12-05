import prisma from "@/database/prisma.ts";
import { createImageTile, updateImageTile } from "./image.ts";
import { createVideoTile, updateVideoTile } from "./video.ts";
import { createTextTile, updateTextTile } from "./text.ts";
import { createLinkTile, updateLinkTile } from "./link.ts";
import { createHeadingTile, updateHeadingTile } from "./heading.ts";
import { createPageLinkTile, updatePageLinkTile } from "./pageLink.ts";
import { createEventTile, updateEventTile } from "./event.ts";
import { createCollectionTile, updateCollectionTile } from "./collection.ts";
import { createMapTile } from "./map.ts";
import type {
  CreateTileSchema,
  UpdateTileSchema,
  MoveTileSchema,
  DeleteTileSchema,
  ResizeTileSchema,
} from "./schema.ts";
import type { AuthenticatedRequestContext } from "@/router/trpc.ts";
import { checkPageAccess } from "@/utils/permissions.ts";
import { TileType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export async function createTile(
  properties: CreateTileSchema,
  context: AuthenticatedRequestContext,
) {
  return prisma.$transaction(async (tx) => {
    await checkPageAccess(tx, context, properties.pageId);

    const position = await tx.tile.count({
      where: { pageId: properties.pageId },
    });
    const { pageId, tile } = properties;
    switch (tile.type) {
      case "IMAGE":
        return createImageTile(tx, pageId, tile, position);
      case "VIDEO":
        return createVideoTile(tx, pageId, tile, position);
      case "TEXT":
        return createTextTile(tx, pageId, tile, position);
      case "LINK":
        return createLinkTile(tx, pageId, tile, position);
      case "HEADING":
        return createHeadingTile(tx, pageId, tile, position);
      case "PAGE_LINK":
        return createPageLinkTile(tx, pageId, tile, position);
      case "EVENT":
        return createEventTile(tx, pageId, tile, position);
      case "COLLECTION":
        return createCollectionTile(
          tx,
          context.user.id,
          pageId,
          tile,
          position,
        );
      case "MAP":
        return createMapTile(tx, pageId, tile, position);
    }
  });
}

export async function updateTile(properties: UpdateTileSchema) {
  const { id, tile } = properties;
  switch (tile.type) {
    case "IMAGE":
      return updateImageTile(prisma, id, tile);
    case "VIDEO":
      return updateVideoTile(prisma, id, tile);
    case "TEXT":
      return updateTextTile(prisma, id, tile);
    case "LINK":
      return updateLinkTile(prisma, id, tile);
    case "HEADING":
      return updateHeadingTile(prisma, id, tile);
    case "PAGE_LINK":
      return updatePageLinkTile(prisma, id, tile);
    case "EVENT":
      return updateEventTile(prisma, id, tile);
    case "COLLECTION":
      return updateCollectionTile(prisma, id, tile);
    case "MAP":
      throw new Error("Not allowed");
  }
}

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
  imageTileId: string;
};

export async function createTilePlacement(
  { pageId, imageTileId }: CreateTilePlacement,
  transaction: Prisma.TransactionClient,
) {
  const position = await transaction.tile.count({
    where: { pageId },
  });
  return transaction.tile.create({
    data: {
      pageId,
      type: TileType.IMAGE,
      position,
      columns: 1,
      rows: 1,
      imageTileId,
    },
    select: {
      position: true,
      columns: true,
      rows: true,
    },
  });
}
