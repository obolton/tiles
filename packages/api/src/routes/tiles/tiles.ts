import prisma, { type ExtensionArgs } from "@/database/prisma";
import type {
  ReorderTileSchema,
  DeleteTilesSchema,
  UpdateTileSchema,
} from "./schema";
import type { Prisma } from "@/generated/prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma";

export const TILE_FIELDS = {
  id: true,
  sectionId: true,
  position: true,
  width: true,
  height: true,
  x: true,
  y: true,
  rowSpan: true,
  block: true,
  animation: true,
} as const satisfies Prisma.TileSelect<ExtensionArgs>;

export async function reorderTile({
  pageId,
  id,
  sectionId,
  afterId,
}: ReorderTileSchema) {
  return prisma.$transaction(async (transaction) => {
    const { sectionId: previousSectionId, position: previousPosition } =
      await transaction.tile.findUniqueOrThrow({
        where: { pageId, id },
        select: { sectionId: true, position: true },
      });

    const afterTile = afterId
      ? await transaction.tile.findUniqueOrThrow({
          where: { pageId, id: afterId, sectionId },
          select: { position: true },
        })
      : null;

    const position = afterTile ? afterTile.position + 1 : 0;

    // Move within same collection
    if (sectionId === previousSectionId) {
      // Move down collection
      if (position > previousPosition) {
        await Promise.all([
          transaction.tile.updateMany({
            where: {
              pageId,
              sectionId,
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
              sectionId,
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
            sectionId: previousSectionId,
            id: { not: id },
            position: { gt: previousPosition },
          },
          data: { position: { decrement: 1 } },
        }),

        // Create space in new collection
        transaction.tile.updateMany({
          where: {
            pageId,
            sectionId,
            id: { not: id },
            position: { gte: position },
          },
          data: { position: { increment: 1 } },
        }),

        // Move item to collection
        transaction.tile.update({
          where: { pageId, id },
          data: { sectionId, position },
          select: { id: true },
        }),
      ]);
    }

    return {
      id,
      pageId,
      fromPosition: previousPosition,
      toPosition: position,
      sectionId,
    };
  });
}

export async function updateTile({
  pageId,
  id,
  sectionId,
  width,
  height,
  x,
  y,
  rowSpan,
  block,
  animation,
}: UpdateTileSchema) {
  return prisma.$transaction(async (transaction) => {
    // Validate section ID
    if (sectionId) {
      await transaction.section.findUniqueOrThrow({
        where: { pageId, id: sectionId },
        select: { id: true },
      });
    }

    return transaction.tile.update({
      where: { pageId, id },
      data: {
        sectionId,
        width,
        height,
        rowSpan,
        x,
        y,
        block,
        animation,
      },
      select: TILE_FIELDS,
    });
  });
}

export async function deleteTiles({ pageId, ids }: DeleteTilesSchema) {
  await prisma.tile.deleteMany({
    where: { pageId, id: { in: ids } },
  });
}

type CreateTilePlacement = Omit<
  Prisma.TileUncheckedCreateInput,
  "id" | "createdAt" | "updatedAt" | "position" | "y"
> & { y?: number };

export async function createTilePlacement(
  {
    pageId,
    sectionId,
    type,
    width,
    height = 1,
    x,
    y,
    rowSpan = 1,
    block,
    animation,
    imageTileId,
    mapTileId,
    textTileId,
    pageLinkTileId,
    linkTileId,
    videoTileId,
    tableId,
    chartId,
  }: CreateTilePlacement,
  transaction: PrismaTransactionClient,
) {
  const position = await transaction.tile.count({
    where: { pageId },
  });

  let insertX;
  let insertY;
  let insertWidth;
  if (
    typeof x === "number" &&
    typeof y === "number" &&
    typeof width === "number"
  ) {
    insertX = x;
    insertY = y;
    insertWidth = width;
  } else {
    const next = await getNextGridPosition(
      { pageId, sectionId, width, maxWidth: 20 },
      transaction,
    );
    insertX = next.x;
    insertY = next.y;
    insertWidth = next.width;
  }

  const { id: placementId, ...tile } = await transaction.tile.create({
    data: {
      pageId,
      sectionId,
      type,
      position,
      width: insertWidth,
      height,
      rowSpan,
      x: insertX,
      y: insertY,
      block,
      animation,
      imageTileId,
      mapTileId,
      textTileId,
      pageLinkTileId,
      linkTileId,
      videoTileId,
      tableId,
      chartId,
    },
    select: TILE_FIELDS,
  });
  return { ...tile, placementId };
}

export async function getNextGridPosition(
  {
    pageId,
    sectionId,
    width: itemWidth,
    maxWidth = 24,
  }: { pageId: string; sectionId: string; width?: number; maxWidth: number },
  transaction: PrismaTransactionClient,
): Promise<{ x: number; y: number; width: number }> {
  const previous = await transaction.tile.findFirst({
    select: { x: true, y: true, width: true, rowSpan: true },
    where: { pageId, sectionId },
    orderBy: [{ y: "desc" }, { x: "desc" }],
  });

  const width = itemWidth ?? previous?.width ?? 20;

  if (!previous) {
    return { x: 0, y: 0, width };
  }

  // Row overflow
  if (previous.x + previous.width + width > maxWidth) {
    return { x: 0, y: previous.y + previous.rowSpan, width };
  }

  return { x: previous.x + previous.width, y: previous.y, width };
}
