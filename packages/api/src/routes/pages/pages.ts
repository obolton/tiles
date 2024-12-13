import { Prisma } from "@prisma/client";
import type { Theme, Font } from "@prisma/client";
import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import {
  getProfileImageUrl,
  getLinkImageUrl,
  getVideoImageUrl,
} from "@/utils/cdn.ts";
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
import type {
  GetPageByIdSchema,
  GetProfilePageByUserIdSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "./schema.ts";
import type { ClientTile } from "@/types/tiles.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

const TILES_FIELDS = {
  id: true,
  position: true,
  columns: true,
  rows: true,
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
} as const satisfies Prisma.TileSelect;

const PAGE_FIELDS = {
  id: true,
  published: true,
  title: true,
  subtitle: true,
  updatedAt: true,
  theme: true,
  hue: true,
  font: true,
  author: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
  tiles: {
    select: TILES_FIELDS,
    where: { parentCollectionId: null },
    orderBy: {
      position: "asc",
    },
  },
} as const satisfies Prisma.PageSelect<ExtensionArgs>;

type TileWithData = Prisma.TileGetPayload<{ select: typeof TILES_FIELDS }>;

function formatTile({
  id,
  position,
  rows,
  columns,
  ...tile
}: TileWithData): ClientTile {
  const base = { placementId: id, position, rows, columns };
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
      imageUrl: video.imageUrl ? getVideoImageUrl(video.id) : null,
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
      imageUrl: link.imageUrl ? getLinkImageUrl(link.id) : null,
    };
  }

  if (pageLink) {
    const page = pageLink.page;
    return {
      type: "PAGE_LINK",
      ...base,
      ...pageLink,
      page: page
        ? {
            id: page.id,
            title: page.title,
            subtitle: page.subtitle,
            theme: page.theme,
            hue: page.hue,
            font: page.font,
            author: page.author,
            imageKey: page.tiles[0]?.image?.imageKey ?? null,
          }
        : null,
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
      type: "COLLECTION",
      ...base,
      ...collection,
      // @ts-expect-error Incompatibility due to collections missing
      items: collection.items.map(formatTile),
    };
  }

  throw new Error(`Invalid tile: ${id}`);
}

export async function getPageById(
  { id }: GetPageByIdSchema,
  userId?: string,
): Promise<{
  id: string;
  published: boolean;
  title: string;
  subtitle: string | null;
  updatedAt: Date;
  theme: Theme;
  hue: number | null;
  font: Font;
  author: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
  tiles: ClientTile[];
} | null> {
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

export async function getProfilePageByUserId({
  userId,
}: GetProfilePageByUserIdSchema) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      imageKey: true,
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
    name: user.name,
    imageUrl: user.imageKey ? getProfileImageUrl(user.imageKey) : null,
    profilePage: {
      ...user.profilePage,
      tiles: user.profilePage.tiles.map(formatTile),
    },
  };
}

export async function listPages(
  { offset }: ListPagesSchema,
  { user }: AuthenticatedRequestContext,
) {
  const count = 15;
  const pages = await prisma.page.findMany({
    where: { authorId: user.id },
    select: PAGE_LINK_TILE_PAGE_FIELDS,
    orderBy: {
      updatedAt: "desc",
    },
    take: count + 1,
    skip: offset,
  });
  return {
    pages: pages.slice(0, count).map((page) => ({
      id: page.id,
      title: page.title,
      subtitle: page.subtitle,
      theme: page.theme,
      hue: page.hue,
      font: page.font,
      author: page.author,
      imageKey: page.tiles[0]?.image?.imageKey ?? null,
    })),
    hasMore: pages.length > count,
  };
}

export async function createPage(
  { title }: CreatePageSchema,
  { user }: AuthenticatedRequestContext,
) {
  return prisma.page.create({
    data: {
      authorId: user.id,
      published: false,
      title,
    },
    select: {
      id: true,
    },
  });
}

export async function updatePage(
  { id, published, title, subtitle, theme, hue, font }: UpdatePageSchema,
  { user }: AuthenticatedRequestContext,
) {
  return prisma.page.update({
    where: { id, authorId: user.id },
    data: { published, title, subtitle, theme, hue, font },
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
    },
  });
}

export async function deletePage(
  { id }: DeletePageSchema,
  { user }: AuthenticatedRequestContext,
) {
  return prisma.page.delete({
    where: { id, authorId: user.id },
    select: {
      id: true,
    },
  });
}
