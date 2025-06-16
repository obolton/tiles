import { Prisma } from "@prisma/client";
import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import {
  PAGE_LINK_FIELDS,
  PAGE_LINK_TILE_PAGE_FIELDS,
} from "@/routes/pageLinks/pageLinks.ts";
import { COLLECTION_FIELDS } from "@/routes/collections/collections.ts";
import { IMAGE_FIELDS } from "@/routes/images/images.ts";
import { MAP_FIELDS } from "@/routes/maps/maps.ts";
import { TEXT_FIELDS } from "@/routes/text/text.ts";
import { LINK_FIELDS } from "@/routes/links/links.ts";
import { VIDEO_FIELDS } from "@/routes/videos/videos.ts";
import {
  PAGE_ACCESS_FIELDS,
  PAGE_INVITE_FIELDS,
} from "@/routes/collaboration/collaboration.ts";
import { TABLE_WITH_DATA_FIELDS } from "@/routes/tables/tables.ts";
import type {
  GetPageByIdSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
  RestorePageSchema,
} from "./schema.ts";
import type { ClientTile } from "@/types/tiles.ts";
import type {
  RequestContext,
  AuthenticatedRequestContext,
} from "@/utils/trpc.ts";

const RESULTS_PER_PAGE = 15;

const DELETED_PAGE_AVAILABILITY = 1000 * 60 * 60 * 24 * 30; // 30 days

const TILES_FIELDS = {
  id: true,
  position: true,
  columns: true,
  rows: true,
  parentCollectionId: true,
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
  collection: {
    select: COLLECTION_FIELDS,
  },
  table: {
    select: TABLE_WITH_DATA_FIELDS,
  },
} as const satisfies Prisma.TileSelect<ExtensionArgs>;

const PAGE_FIELDS = {
  id: true,
  published: true,
  title: true,
  subtitle: true,
  updatedAt: true,
  color: true,
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
  collections: {
    select: COLLECTION_FIELDS,
    orderBy: {
      createdAt: "asc",
    },
  },
  tiles: {
    select: TILES_FIELDS,
    orderBy: {
      position: "asc",
    },
  },
} as const satisfies Prisma.Args<typeof prisma.page, "findMany">["select"];

type TileWithData = Prisma.Result<
  typeof prisma.tile,
  { select: typeof TILES_FIELDS },
  "findMany"
>[number];

export function formatTile({
  id,
  position,
  rows,
  columns,
  parentCollectionId,
  ...tile
}: TileWithData): ClientTile {
  const base = {
    placementId: id,
    position,
    rows,
    columns,
    parentCollectionId,
  };
  const { image, video, text, map, link, pageLink, collection, table } = tile;

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

  if (collection) {
    return {
      ...base,
      ...collection,
      type: "COLLECTION",
    };
  }

  if (table) {
    const { _count, ...tableData } = table;
    return {
      ...base,
      ...tableData,
      numRows: _count.tableRows,
      type: "TABLE",
    };
  }

  throw new Error(`Invalid tile: ${id}`);
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
  { userId, workspaceId }: AuthenticatedRequestContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { subtitle: { contains: query, mode: "insensitive" } },
        ],
      }
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
  { userId }: AuthenticatedRequestContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { subtitle: { contains: query, mode: "insensitive" } },
        ],
      }
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
  { userId, workspaceId }: AuthenticatedRequestContext,
) {
  const filter: Prisma.PageWhereInput = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { subtitle: { contains: query, mode: "insensitive" } },
        ],
      }
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
  { userId, workspaceId }: AuthenticatedRequestContext,
) {
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
    await transaction.collection.create({
      data: {
        pageId: page.id,
        type: "SECTION",
        items: {
          create: {
            page: {
              connect: { id: page.id },
            },
            type: "TEXT",
            position: 0,
            rows: 1,
            columns: 6,
            text: {
              create: {
                pageId: page.id,
                expand: true,
                content: [
                  {
                    type: "heading",
                    level: 1,
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

export async function updatePage(
  {
    pageId,
    published,
    title,
    subtitle,
    color,
    font,
    coverImageKey,
  }: UpdatePageSchema,
  { userId, workspaceId }: AuthenticatedRequestContext,
) {
  return prisma.page.update({
    where: { workspaceId, id: pageId, authorId: userId, deletedAt: null },
    data: {
      published,
      title,
      subtitle,
      lightness: color ? color.l : undefined,
      chroma: color ? color.c : undefined,
      hue: color ? color.h : undefined,
      font,
      coverImageKey,
    },
    select: PAGE_FIELDS,
  });
}

export async function deletePage(
  { pageId }: DeletePageSchema,
  { userId, workspaceId }: AuthenticatedRequestContext,
) {
  return prisma.page.update({
    where: { workspaceId, id: pageId, authorId: userId, deletedAt: null },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}

export async function restorePage(
  { pageId }: RestorePageSchema,
  { userId, workspaceId }: AuthenticatedRequestContext,
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
}: AuthenticatedRequestContext) {
  return prisma.page.deleteMany({
    where: { workspaceId, authorId: userId, deletedAt: { not: null } },
  });
}
