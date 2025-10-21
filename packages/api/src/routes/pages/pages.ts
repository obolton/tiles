import { generateKeyBetween } from "fractional-indexing";
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
import type { AuthenticatedWorkspaceProcedureContext } from "@/utils/middleware";
import type { ColorSchema } from "@/schema/Color";

const RESULTS_PER_PAGE = 15;

const DELETED_PAGE_AVAILABILITY = 1000 * 60 * 60 * 24 * 30; // 30 days

const TILES_FIELDS = {
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
  image: {
    select: IMAGE_FIELDS,
  },
  video: {
    select: VIDEO_FIELDS,
  },
  text: {
    select: TEXT_FIELDS,
  },
  map: {
    select: MAP_FIELDS,
  },
  link: {
    select: LINK_FIELDS,
  },
  pageLink: {
    select: PAGE_LINK_FIELDS,
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
  published: true,
  title: true,
  updatedAt: true,
  backgroundColor: true,
  font: true,
  coverImageUrl: true,
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
  sections: {
    select: SECTION_FIELDS,
    orderBy: {
      order: "asc",
    },
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
    id: placementId,
    image,
    video,
    text,
    map,
    link,
    pageLink,
    table,
    chart,
    ...properties
  } = tile;
  const base = { placementId, ...properties };

  if (image) {
    return {
      type: "IMAGE",
      ...base,
      ...image,
    };
  }

  if (video) {
    return {
      type: "VIDEO",
      ...base,
      ...video,
    };
  }

  if (text) {
    return {
      type: "TEXT",
      ...base,
      ...text,
    };
  }

  if (map) {
    return {
      type: "MAP",
      ...base,
      ...map,
    };
  }

  if (link) {
    return {
      type: "LINK",
      ...base,
      ...link,
    };
  }

  if (pageLink) {
    return {
      type: "PAGE_LINK",
      ...base,
      ...pageLink,
    };
  }

  if (table) {
    const { _count, ...tableData } = table;
    return {
      ...base,
      ...tableData,
      numRows: _count.rows,
      type: "TABLE",
    };
  }

  if (chart) {
    return {
      type: "CHART",
      ...base,
      ...chart,
    };
  }

  throw new Error(`Invalid tile: ${placementId}`);
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
  { query, offset }: ListPagesSchema,
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
    select: {
      ...PAGE_LINK_TILE_PAGE_FIELDS,
      author: false,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: RESULTS_PER_PAGE + 1,
    skip: offset,
  });
  return {
    pages: pages.slice(0, RESULTS_PER_PAGE),
    hasMore: pages.length > RESULTS_PER_PAGE,
  };
}

export async function listSharedPages(
  { query, offset }: ListPagesSchema,
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
    skip: offset,
  });
  return {
    pages: pages.slice(0, RESULTS_PER_PAGE),
    hasMore: pages.length > RESULTS_PER_PAGE,
  };
}

export async function listDeletedPages(
  { query, offset }: ListPagesSchema,
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
    select: {
      ...PAGE_LINK_TILE_PAGE_FIELDS,
      author: false,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: RESULTS_PER_PAGE + 1,
    skip: offset,
  });
  return {
    pages: pages.slice(0, RESULTS_PER_PAGE),
    hasMore: pages.length > RESULTS_PER_PAGE,
  };
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
    await transaction.section.create({
      data: {
        pageId: page.id,
        order: first,
        layout: "GRID",
        items: {
          create: {
            page: {
              connect: { id: page.id },
            },
            type: "TEXT",
            order: first,
            x: 0,
            y: 0,
            width: 20,
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
  }: UpdatePageSchema,
  { userId }: AuthenticatedRequestContext,
) {
  return prisma.page.update({
    where: { id: pageId, authorId: userId, deletedAt: null },
    data: {
      published,
      title,
      ...getBackgroundColorProperties(backgroundColor),
      font,
      coverImageKey,
    },
    select: PAGE_FIELDS,
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
