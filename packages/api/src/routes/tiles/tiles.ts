import { generateKeyBetween } from "fractional-indexing";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import {
  getFirstTileOrderQuery,
  getTileOrderQuery,
} from "@/generated/prisma/sql";
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
  order: true,
  width: true,
  height: true,
  x: true,
  y: true,
  rowSpan: true,
  block: true,
  animation: true,
} as const satisfies Prisma.TileSelect<ExtensionArgs>;

export async function getTileOrder(
  transaction: PrismaTransactionClient,
  pageId: string,
  sectionId: string,
  afterTileId: string | null,
): Promise<string> {
  if (afterTileId === null) {
    const [result] = await transaction.$queryRawTyped(
      getFirstTileOrderQuery(pageId, sectionId),
    );
    return generateKeyBetween(null, result?.order ?? null);
  }

  const [result] = await transaction.$queryRawTyped(
    getTileOrderQuery(pageId, sectionId, afterTileId),
  );
  return generateKeyBetween(result?.a ?? null, result?.b ?? null);
}

export async function reorderTile({
  pageId,
  id,
  sectionId,
  afterId,
}: ReorderTileSchema) {
  return prisma.$transaction(async (transaction) => {
    const order = await getTileOrder(
      transaction,
      pageId,
      sectionId,
      afterId ?? null,
    );
    return transaction.tile.update({
      where: { pageId, id },
      data: { sectionId, order },
      select: TILE_FIELDS,
    });
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
  "id" | "createdAt" | "updatedAt" | "order" | "y"
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

  const order = await getTileOrder(transaction, pageId, sectionId, null);

  const { id: placementId, ...tile } = await transaction.tile.create({
    data: {
      pageId,
      sectionId,
      type,
      order,
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
