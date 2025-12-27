import { generateKeyBetween } from "fractional-indexing";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import {
  getFirstTileOrderQuery,
  getTileOrderQuery,
  duplicateTileQuery,
} from "@/generated/prisma/sql";
import type {
  UpdateTileSchema,
  DuplicateTileSchema,
  DeleteTilesSchema,
} from "./schema";
import { THEME_FIELDS } from "@/routes/themes/themes";
import type { Prisma } from "@/generated/prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma";
import type { TileType } from "@/generated/prisma/enums";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";

export const TILE_FIELDS = {
  id: true,
  type: true,
  sectionId: true,
  theme: {
    select: THEME_FIELDS,
  },
  order: true,
  anchor: true,
  dimensions: true,
  width: true,
  height: true,
  x: true,
  y: true,
  rowSpan: true,
  block: true,
  animation: true,
  hide: true,
} as const satisfies Prisma.TileSelect<ExtensionArgs>;

export async function getTileOrder(
  transaction: PrismaTransactionClient,
  pageId: string,
  sectionId: string | null,
  afterId: string | null,
): Promise<string> {
  if (afterId === null) {
    const [result] = await transaction.$queryRawTyped(
      getFirstTileOrderQuery(pageId, sectionId),
    );
    return generateKeyBetween(null, result?.order ?? null);
  }

  const [result] = await transaction.$queryRawTyped(
    getTileOrderQuery(pageId, sectionId, afterId),
  );
  return generateKeyBetween(result?.a ?? null, result?.b ?? null);
}

export async function getTileSectionId(
  transaction: PrismaTransactionClient,
  { id, pageId }: { id: string; pageId: string },
) {
  const { sectionId } = await transaction.tile.findUniqueOrThrow({
    where: { id, pageId },
    select: { sectionId: true },
  });
  return sectionId;
}

export async function updateTile(
  {
    pageId,
    id,
    sectionId,
    afterId,
    anchor,
    dimensions,
    width,
    height,
    x,
    y,
    rowSpan,
    block,
    animation,
    hide,
    themeId,
  }: UpdateTileSchema,
  { workspaceId }: AuthenticatedPageProcedureContext,
) {
  return prisma.$transaction(async (transaction) => {
    // Validate section ID
    if (sectionId) {
      await transaction.section.findUniqueOrThrow({
        where: { pageId, id: sectionId },
        select: { id: true },
      });
    }

    // Validate theme belongs to same workspace
    if (themeId) {
      await transaction.theme.findUniqueOrThrow({
        where: { id: themeId, workspaceId },
        select: { id: true },
      });
    }

    let order = undefined;
    if (typeof afterId !== "undefined") {
      const orderSectionId =
        typeof sectionId === "undefined"
          ? await getTileSectionId(transaction, { id, pageId })
          : sectionId;
      order = await getTileOrder(
        transaction,
        pageId,
        orderSectionId,
        afterId ?? null,
      );
    }

    return transaction.tile.update({
      where: { pageId, id },
      data: {
        sectionId,
        order,
        anchor,
        dimensions,
        width,
        height,
        rowSpan,
        x,
        y,
        block,
        animation,
        hide,
        themeId,
      },
      select: TILE_FIELDS,
    });
  });
}

// TODO: Duplicate tile relations (could be simplified by consolidating tables)
export async function duplicateTile({
  pageId,
  id,
  sectionId,
}: DuplicateTileSchema) {
  return prisma.$transaction(async (transaction) => {
    // TODO: Validate section ID
    const order = await getTileOrder(transaction, pageId, sectionId, id);
    const result = await transaction.$queryRawTyped(
      duplicateTileQuery(pageId, id, order),
    );
    const newId = result[0]?.id;
    if (!newId) {
      throw new Error("Could not duplicate tile");
    }
    return transaction.tile.findUniqueOrThrow({
      where: { pageId, id: newId },
      select: TILE_FIELDS,
    });
  });
}

export async function deleteTiles({ pageId, ids }: DeleteTilesSchema) {
  await prisma.tile.deleteMany({
    where: { pageId, id: { in: ids } },
  });
}

type RequireExactlyOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & {
    [P in Exclude<keyof T, K>]?: never;
  };
}[keyof T];

type CreateTileProperties = RequireExactlyOne<{
  section?: Prisma.SectionUncheckedCreateWithoutTileInput;
  text?: Prisma.TextTileUncheckedCreateWithoutTileInput;
  image?: Prisma.ImageTileUncheckedCreateWithoutTileInput;
  video?: Prisma.VideoTileUncheckedCreateWithoutTileInput;
  link?: Prisma.LinkTileUncheckedCreateWithoutTileInput;
  pageLink?: Prisma.PageLinkTileUncheckedCreateWithoutTileInput;
  map?: Prisma.MapTileUncheckedCreateWithoutTileInput;
  table?: Prisma.TableUncheckedCreateWithoutTileInput;
  chart?: Prisma.ChartUncheckedCreateWithoutTileInput;
}>;

type CreateTileOptions<T extends TileType> = Omit<
  Prisma.TileUncheckedCreateInput,
  "id" | "createdAt" | "updatedAt" | "type" | "order" | "y"
> &
  CreateTileProperties & {
    type: T;
    afterId?: string | null;
    y?: number;
  };

export async function createTile<
  T extends TileType,
  S extends Prisma.TileSelect<ExtensionArgs>,
>(
  {
    pageId,
    sectionId = null,
    type,
    afterId = null,
    anchor,
    dimensions,
    width,
    height = 1,
    x,
    y,
    rowSpan = 1,
    block,
    animation,
    hide,
    section,
    text,
    image,
    video,
    link,
    pageLink,
    map,
    table,
    chart,
  }: CreateTileOptions<T>,
  select: S,
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
    const next = await getNextPosition(
      { pageId, sectionId, width, maxWidth: 20 },
      transaction,
    );
    insertX = next.x;
    insertY = next.y;
    insertWidth = next.width;
  }

  const order = await getTileOrder(transaction, pageId, sectionId, afterId);

  const tile = await transaction.tile.create({
    data: {
      pageId,
      sectionId,
      type,
      order,
      anchor,
      dimensions,
      width: insertWidth,
      height,
      rowSpan,
      x: insertX,
      y: insertY,
      block,
      animation,
      hide,
      section: section ? { create: section } : undefined,
      text: text ? { create: text } : undefined,
      image: image ? { create: image } : undefined,
      video: video ? { create: video } : undefined,
      link: link ? { create: link } : undefined,
      pageLink: pageLink ? { create: pageLink } : undefined,
      map: map ? { create: map } : undefined,
      table: table ? { create: table } : undefined,
      chart: chart ? { create: chart } : undefined,
    },
    select: {
      ...TILE_FIELDS,
      ...select,
    },
  });
  return { ...tile, type };
}

interface NextPositionOptions {
  pageId: string;
  sectionId: string | null;
  width?: number;
  maxWidth?: number;
}

interface NextPosition {
  x: number;
  y: number;
  width: number;
}

export async function getNextPosition(
  options: NextPositionOptions,
  transaction: PrismaTransactionClient,
): Promise<NextPosition> {
  const { pageId, sectionId } = options;

  if (sectionId) {
    const section = await transaction.section.findUnique({
      where: { id: sectionId, pageId },
      select: { layout: true },
    });

    if (section?.layout === "FREEFORM") {
      return getNextFreeformPosition(options);
    }
  }

  return getNextGridPosition(options, transaction);
}

function getNextFreeformPosition({
  width: itemWidth,
}: NextPositionOptions): NextPosition {
  return { x: 5, y: 5, width: itemWidth ?? 20 };
}

async function getNextGridPosition(
  { pageId, sectionId, width: itemWidth, maxWidth = 24 }: NextPositionOptions,
  transaction: PrismaTransactionClient,
): Promise<NextPosition> {
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
