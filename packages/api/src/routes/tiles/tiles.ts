import { generateKeyBetween } from "fractional-indexing";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import {
  getLastTileOrderQuery,
  getTileOrderQuery,
  duplicateTileQuery,
} from "@/generated/prisma/sql";
import {
  getTextColorProperties,
  getBackgroundProperties,
} from "@/utils/themes";
import type {
  UpdateTileSchema,
  DuplicateTileSchema,
  DeleteTilesSchema,
} from "./schema";
import type { ColorSchema } from "@/schema/Color";
import type { BackgroundSchema } from "@/schema/Background";
import type { Prisma } from "@/generated/prisma/client";
import type { PrismaTransactionClient } from "@/database/prisma";
import type { FrameStyle, TileType } from "@/generated/prisma/enums";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";
import { TILE_FIELDS, FULL_TILE_FIELDS, type FullTile } from "./fields";
import type { ClientTile } from "@/types/tiles";

export function formatTile(tile: FullTile): ClientTile {
  const {
    type: _,
    section,
    text,
    image,
    video,
    link,
    pageLink,
    map,
    table,
    chart,
    ...properties
  } = tile;

  if (section) {
    return {
      type: "SECTION",
      ...properties,
      ...section,
    };
  }

  if (text) {
    return {
      type: "TEXT",
      ...properties,
      ...text,
    };
  }

  if (image) {
    return {
      type: "IMAGE",
      ...properties,
      ...image,
    };
  }

  if (video) {
    return {
      type: "VIDEO",
      ...properties,
      ...video,
    };
  }

  if (link) {
    return {
      type: "LINK",
      ...properties,
      ...link,
    };
  }

  if (pageLink) {
    return {
      type: "PAGE_LINK",
      ...properties,
      ...pageLink,
    };
  }

  if (map) {
    return {
      type: "MAP",
      ...properties,
      ...map,
    };
  }

  if (table) {
    const { _count, ...tableData } = table;
    return {
      ...properties,
      ...tableData,
      numRows: _count.rows,
      type: "TABLE",
    };
  }

  if (chart) {
    return {
      type: "CHART",
      ...properties,
      ...chart,
    };
  }

  throw new Error(`Invalid tile: ${tile.id}`);
}

export async function getTileOrder(
  transaction: PrismaTransactionClient,
  pageId: string,
  sectionId: string | null,
  beforeId: string | null,
): Promise<string> {
  if (beforeId === null) {
    const [result] = await transaction.$queryRawTyped(
      getLastTileOrderQuery(pageId, sectionId),
    );
    return generateKeyBetween(result?.order ?? null, null);
  }

  const [result] = await transaction.$queryRawTyped(
    getTileOrderQuery(pageId, sectionId, beforeId),
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
    beforeId,
    sizing,
    width,
    height,
    x,
    y,
    rowSpan,
    animation,
    frame,
    hide,
    themeId,
    dock,
    textColor,
    background,
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
    if (beforeId !== undefined) {
      const orderSectionId =
        sectionId === undefined
          ? await getTileSectionId(transaction, { id, pageId })
          : sectionId;
      order = await getTileOrder(
        transaction,
        pageId,
        orderSectionId,
        beforeId ?? null,
      );
    }

    return transaction.tile.update({
      where: { pageId, id },
      data: {
        sectionId,
        order,
        sizing,
        width,
        height,
        rowSpan,
        x,
        y,
        animation,
        frame,
        hide,
        themeId,
        dock,
        ...getTextColorProperties(textColor),
        ...getBackgroundProperties(background),
      },
      select: TILE_FIELDS,
    });
  });
}

export async function duplicateTile({
  pageId,
  id,
  sectionId,
  beforeId,
}: DuplicateTileSchema): Promise<[ClientTile, ...ClientTile[]]> {
  return prisma.$transaction(async (transaction) => {
    // TODO: Validate section ID
    const order = await getTileOrder(
      transaction,
      pageId,
      sectionId,
      beforeId ?? null,
    );
    const result = await transaction.$queryRawTyped(
      duplicateTileQuery(pageId, id, order, sectionId),
    );
    const newId = result[0]?.id;
    if (!newId) {
      throw new Error("Could not duplicate tile");
    }
    const tile = await transaction.tile.findUniqueOrThrow({
      where: { pageId, id: newId },
      select: FULL_TILE_FIELDS,
    });

    if (tile.type === "SECTION") {
      const children = await transaction.tile.findMany({
        where: { pageId, sectionId: newId },
        select: FULL_TILE_FIELDS,
        orderBy: { order: "asc" },
      });
      return [formatTile(tile), ...children.map(formatTile)];
    }

    return [formatTile(tile)];
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
  | "id"
  | "createdAt"
  | "updatedAt"
  | "type"
  | "order"
  | "y"
  | "frame"
  | "textColor"
  | "backgroundColor"
  | "backgroundGradient"
  | "backgroundImageId"
> &
  CreateTileProperties & {
    type: T;
    beforeId?: string | null;
    y?: number;
    frame?: FrameStyle | null;
    textColor?: ColorSchema | null;
    background?: BackgroundSchema | null;
  };

export async function createTile<
  T extends TileType,
  S extends Prisma.TileSelect<ExtensionArgs>,
>(
  {
    pageId,
    sectionId = null,
    type,
    beforeId = null,
    sizing,
    width,
    height = 1,
    x,
    y,
    rowSpan = 1,
    animation,
    frame,
    hide,
    textColor,
    background,
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
  let insertX: number;
  let insertY: number;
  let insertWidth = width;
  if (typeof x === "number" && typeof y === "number") {
    insertX = x;
    insertY = y;
  } else {
    const next = await getNextPosition(
      { pageId, sectionId, width, maxWidth: 20 },
      transaction,
    );
    insertX = next.x;
    insertY = next.y;
    if (insertWidth === undefined && sectionId) {
      insertWidth = next.width;
    }
  }

  const order = await getTileOrder(transaction, pageId, sectionId, beforeId);

  const tile = await transaction.tile.create({
    data: {
      pageId,
      sectionId,
      type,
      order,
      sizing,
      width: insertWidth,
      height,
      rowSpan,
      x: insertX,
      y: insertY,
      animation,
      frame,
      hide,
      ...getTextColorProperties(textColor),
      ...getBackgroundProperties(background),
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
  width?: number | null;
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
  return { x: 5, y: 5, width: itemWidth ?? 1 };
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

  const width = itemWidth ?? previous?.width ?? 1;

  if (!previous) {
    return { x: 0, y: 0, width };
  }

  const previousWidth = previous.width ?? 1;

  // Row overflow
  if (previous.x + previousWidth + width > maxWidth) {
    return { x: 0, y: previous.y + previous.rowSpan, width };
  }

  return { x: previous.x + previousWidth, y: previous.y, width };
}
