import { generateKeyBetween } from "fractional-indexing";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@/generated/prisma/client";
import prisma, { type ExtensionArgs } from "@/database/prisma";
import {
  PAGE_LINK_FIELDS,
  PAGE_LINK_TILE_PAGE_FIELDS,
} from "@/routes/pageLinks/pageLinks";
import { SECTION_FIELDS } from "@/routes/sections/sections";
import { IMAGE_FIELDS } from "@/routes/images/images";
import { MAP_FIELDS } from "@/routes/maps/maps";
import { TEXT_FIELDS } from "@/routes/text/text";
import { LINK_FIELDS } from "@/routes/links/links";
import { VIDEO_FIELDS } from "@/routes/videos/videos";
import {
  PAGE_ACCESS_FIELDS,
  PAGE_INVITE_FIELDS,
} from "@/routes/collaboration/collaboration";
import { TABLE_WITH_DATA_FIELDS } from "@/routes/tables/tables";
import { CHART_FIELDS } from "@/routes/charts/charts";
import { DROPDOWN_FIELDS } from "@/routes/dropdowns/dropdowns";
import { THEME_FIELDS } from "@/routes/themes/themes";
import { RESULTS_PER_PAGE, paginate } from "@/utils/pagination";
import type {
  GetPageByIdSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
  RestorePageSchema,
} from "./schema";
import type { ClientTile } from "@/types/tiles";
import type { RequestContext, AuthenticatedRequestContext } from "@/utils/trpc";
import type {
  AuthenticatedWorkspaceProcedureContext,
  AuthenticatedPageProcedureContext,
} from "@/utils/middleware";
import type { ColorSchema } from "@/schema/Color";

const DELETED_PAGE_AVAILABILITY = 1000 * 60 * 60 * 24 * 30; // 30 days

const TILES_FIELDS = {
  id: true,
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
  dock: true,
  section: {
    select: SECTION_FIELDS,
  },
  text: {
    select: TEXT_FIELDS,
  },
  image: {
    select: IMAGE_FIELDS,
  },
  video: {
    select: VIDEO_FIELDS,
  },
  link: {
    select: LINK_FIELDS,
  },
  pageLink: {
    select: PAGE_LINK_FIELDS,
  },
  map: {
    select: MAP_FIELDS,
  },
  table: {
    select: TABLE_WITH_DATA_FIELDS,
  },
  chart: {
    select: CHART_FIELDS,
  },
} as const satisfies Prisma.TileSelect<ExtensionArgs>;

const PAGE_FIELDS = {
  id: true,
  workspaceId: true,
  folderId: true,
  theme: {
    select: THEME_FIELDS,
  },
  published: true,
  title: true,
  updatedAt: true,
  backgroundColor: true,
  font: true,
  coverImageUrl: true,
  dockTopHeight: true,
  dockBottomHeight: true,
  dockLeftWidth: true,
  dockRightWidth: true,
  author: {
    select: {
      id: true,
      username: true,
      name: true,
      imageUrl: true,
    },
  },
  access: {
    select: PAGE_ACCESS_FIELDS,
  },
  invites: {
    select: PAGE_INVITE_FIELDS,
  },
  tiles: {
    select: TILES_FIELDS,
    orderBy: {
      order: "asc",
    },
  },
  dropdowns: {
    select: DROPDOWN_FIELDS,
  },
} as const satisfies Prisma.Args<typeof prisma.page, "findMany">["select"];

type TileWithData = Prisma.Result<
  typeof prisma.tile,
  { select: typeof TILES_FIELDS },
  "findMany"
>[number];

export function formatTile(tile: TileWithData): ClientTile {
  const {
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

export async function getPageById(
  { id }: GetPageByIdSchema,
  { userId }: RequestContext,
) {
  const page = await prisma.page.findUnique({
    where: userId
      ? {
          id,
          deletedAt: null,
          OR: [
            { published: true },
            { authorId: userId },
            { access: { some: { userId } } },
          ],
        }
      : { id, deletedAt: null, published: true },
    select: PAGE_FIELDS,
  });

  if (!page) {
    return null;
  }

  return {
    ...page,
    tiles: page.tiles.map(formatTile),
  };
}

export async function listPages(
  { query, cursor }: ListPagesSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? { title: { contains: query, mode: "insensitive" } }
    : {};
  const pages = await prisma.page.findMany({
    where: {
      workspaceId,
      authorId: userId,
      deletedAt: null,
      ...filter,
    },
    select: PAGE_LINK_TILE_PAGE_FIELDS,
    orderBy: {
      updatedAt: "desc",
    },
    take: RESULTS_PER_PAGE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  const { items, nextCursor } = paginate(pages, (p) => p.id);
  return { pages: items, nextCursor };
}

export async function listSharedPages(
  { query, cursor }: ListPagesSchema,
  { userId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? { title: { contains: query, mode: "insensitive" } }
    : {};
  const pages = await prisma.page.findMany({
    where: {
      access: { some: { userId } },
      deletedAt: null,
      ...filter,
    },
    select: PAGE_LINK_TILE_PAGE_FIELDS,
    orderBy: {
      updatedAt: "desc",
    },
    take: RESULTS_PER_PAGE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  const { items, nextCursor } = paginate(pages, (p) => p.id);
  return { pages: items, nextCursor };
}

export async function listDeletedPages(
  { query, cursor }: ListPagesSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? { title: { contains: query, mode: "insensitive" } }
    : {};
  const pages = await prisma.page.findMany({
    where: {
      workspaceId,
      authorId: userId,
      deletedAt: {
        not: null,
        gt: new Date(Date.now() - DELETED_PAGE_AVAILABILITY),
      },
      ...filter,
    },
    select: PAGE_LINK_TILE_PAGE_FIELDS,
    orderBy: {
      updatedAt: "desc",
    },
    take: RESULTS_PER_PAGE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  const { items, nextCursor } = paginate(pages, (p) => p.id);
  return { pages: items, nextCursor };
}

export async function createPage(
  { title }: CreatePageSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  const first = generateKeyBetween(null, null);
  return prisma.$transaction(async (transaction) => {
    const page = await transaction.page.create({
      data: {
        workspaceId,
        authorId: userId,
        published: false,
        title,
      },
      select: {
        id: true,
      },
    });
    await transaction.tile.create({
      data: {
        pageId: page.id,
        type: "TEXT",
        order: first,
        x: 0,
        y: 0,
        width: 24,
        height: 1,
        block: true,
        text: {
          create: {
            pageId: page.id,
            content: [
              {
                type: "paragraph",
                children: [],
              },
            ],
          },
        },
      },
      select: {
        id: true,
      },
    });
    return page;
  });
}

function getBackgroundColorProperties(
  color?: ColorSchema | null,
): Pick<Prisma.PageCreateInput, "backgroundColor"> {
  if (typeof color === "undefined" || color === null) {
    return { backgroundColor: color };
  }
  return { backgroundColor: new Uint8Array(Buffer.from(color, "hex")) };
}

export async function updatePage(
  {
    pageId,
    published,
    title,
    backgroundColor,
    font,
    coverImageKey,
    folderId,
    themeId,
    dockTopHeight,
    dockBottomHeight,
    dockLeftWidth,
    dockRightWidth,
  }: UpdatePageSchema,
  { userId, workspaceId }: AuthenticatedPageProcedureContext,
) {
  return prisma.$transaction(async (transaction) => {
    // Validate folder ownership only when folderId is being set
    if (folderId) {
      const folder = await transaction.folder.findUniqueOrThrow({
        where: { id: folderId },
        select: { workspaceId: true },
      });

      if (folder.workspaceId !== workspaceId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid folder" });
      }
    }

    // Validate theme belongs to same workspace
    if (themeId) {
      await transaction.theme.findUniqueOrThrow({
        where: { id: themeId, workspaceId },
        select: { id: true },
      });
    }

    return transaction.page.update({
      where: { id: pageId, authorId: userId, deletedAt: null },
      data: {
        published,
        title,
        ...getBackgroundColorProperties(backgroundColor),
        font,
        coverImageKey,
        folderId,
        themeId,
        dockTopHeight,
        dockBottomHeight,
        dockLeftWidth,
        dockRightWidth,
      },
      select: PAGE_FIELDS,
    });
  });
}

export async function deletePage(
  { pageId }: DeletePageSchema,
  { userId }: AuthenticatedRequestContext,
) {
  return prisma.page.update({
    where: { id: pageId, authorId: userId, deletedAt: null },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}

export async function restorePage(
  { pageId }: RestorePageSchema,
  { userId, workspaceId }: AuthenticatedWorkspaceProcedureContext,
) {
  return prisma.page.update({
    where: {
      workspaceId,
      id: pageId,
      authorId: userId,
      deletedAt: { not: null },
    },
    data: { deletedAt: null },
    select: { id: true },
  });
}

export async function emptyTrash({
  userId,
  workspaceId,
}: AuthenticatedWorkspaceProcedureContext) {
  return prisma.page.deleteMany({
    where: { workspaceId, authorId: userId, deletedAt: { not: null } },
  });
}
