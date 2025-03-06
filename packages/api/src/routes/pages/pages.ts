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
import { EVENT_FIELDS } from "@/routes/events/events.ts";
import { LINK_FIELDS } from "@/routes/links/links.ts";
import { VIDEO_FIELDS } from "@/routes/videos/videos.ts";
import {
  PAGE_ACCESS_FIELDS,
  PAGE_INVITE_FIELDS,
} from "@/routes/collaboration/collaboration.ts";
import type {
  GetPageByIdSchema,
  GetProfilePageSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "./schema.ts";
import type { ClientTile } from "@/types/tiles.ts";
import type { AuthenticatedProcedureContext } from "@/utils/middleware.ts";

const RESULTS_PER_PAGE = 15;

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
  event: {
    select: EVENT_FIELDS,
  },
  collection: {
    select: COLLECTION_FIELDS,
  },
} as const satisfies Prisma.TileSelect<ExtensionArgs>;

const PAGE_FIELDS = {
  id: true,
  published: true,
  title: true,
  subtitle: true,
  updatedAt: true,
  theme: true,
  hue: true,
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
    where: { type: "SECTION" },
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
} as const satisfies Prisma.PageSelect<ExtensionArgs>;

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
  const { image, video, text, map, link, pageLink, event, collection } = tile;

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

  if (event) {
    return {
      type: "EVENT",
      ...base,
      ...event,
      start: event.start.toISOString(),
      end: event.end?.toISOString() ?? null,
    };
  }

  if (collection) {
    return {
      ...base,
      ...collection,
      type: "COLLECTION",
    };
  }

  throw new Error(`Invalid tile: ${id}`);
}

export async function getPageById({ id }: GetPageByIdSchema, userId?: string) {
  const page = await prisma.page.findUnique({
    where: { id },
    select: PAGE_FIELDS,
  });

  if (!page) {
    return null;
  }

  if (!page.published && (!userId || page.author.id !== userId)) {
    return null;
  }

  return {
    ...page,
    tiles: page.tiles.map(formatTile),
  };
}

export async function getProfilePage(input: GetProfilePageSchema) {
  const where =
    "userId" in input ? { id: input.userId } : { username: input.username };

  const user = await prisma.user.findUnique({
    where,
    select: {
      id: true,
      username: true,
      name: true,
      imageUrl: true,
      profilePage: {
        select: PAGE_FIELDS,
      },
    },
  });

  if (!user || !user.profilePage) {
    return null;
  }

  return {
    id: user.name,
    username: user.username,
    name: user.name,
    imageUrl: user.imageUrl,
    profilePage: {
      ...user.profilePage,
      tiles: user.profilePage.tiles.map(formatTile),
    },
  };
}

export async function listPages(
  { query, offset }: ListPagesSchema,
  { user }: AuthenticatedProcedureContext,
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
      authorId: user.id,
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

export async function createPage(
  { title }: CreatePageSchema,
  { user }: AuthenticatedProcedureContext,
) {
  return prisma.page.create({
    data: {
      authorId: user.id,
      published: false,
      title,
      collections: {
        create: {
          type: "SECTION",
        },
      },
    },
    select: {
      id: true,
    },
  });
}

export async function updatePage(
  {
    pageId,
    published,
    title,
    subtitle,
    theme,
    hue,
    font,
    coverImageKey,
  }: UpdatePageSchema,
  { user }: AuthenticatedProcedureContext,
) {
  return prisma.page.update({
    where: { id: pageId, authorId: user.id },
    data: { published, title, subtitle, theme, hue, font, coverImageKey },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      published: true,
      title: true,
      subtitle: true,
      theme: true,
      hue: true,
      font: true,
      coverImageUrl: true,
    },
  });
}

export async function deletePage(
  { pageId }: DeletePageSchema,
  { user }: AuthenticatedProcedureContext,
) {
  return prisma.page.delete({
    where: { id: pageId, authorId: user.id },
    select: {
      id: true,
    },
  });
}
