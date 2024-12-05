import { Prisma } from "@prisma/client";
import type { Theme, Font } from "@prisma/client";
import prisma from "@/database/prisma.ts";
import {
  getProfileImageUrl,
  getLinkImageUrl,
  getVideoImageUrl,
} from "@/utils/cdn.ts";
import {
  PAGE_LINK_FIELDS,
  PAGE_LINK_TILE_PAGE_FIELDS,
} from "@/models/pageLinks/pageLinks.ts";
import { COLLECTION_FIELDS } from "@/models/collections/collections.ts";
import { IMAGE_FIELDS } from "@/models/images/images.ts";
import { MAP_FIELDS } from "@/models/maps/maps.ts";
import { TEXT_FIELDS } from "@/models/text/text.ts";
import { HEADING_FIELDS } from "@/models/headings/headings.ts";
import { EVENT_FIELDS } from "@/models/events/events.ts";
import { LINK_FIELDS } from "@/models/links/links.ts";
import { VIDEO_FIELDS } from "@/models/videos/videos.ts";
import type {
  GetPageByIdSchema,
  GetProfilePageByUserIdSchema,
  GetRecentPagesWithTilesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "./schema.ts";
import type { ClientTile } from "@/types/tiles.ts";
import type { AuthenticatedRequestContext } from "@/router/trpc.ts";

const TILES_FIELDS = {
  id: true,
  type: true,
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
  heading: {
    select: HEADING_FIELDS,
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
      imageKey: true,
    },
  },
  tiles: {
    select: TILES_FIELDS,
    where: { parentCollectionId: null },
    orderBy: {
      position: "asc",
    },
  },
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const tileWithDataValidator = Prisma.validator<Prisma.TileDefaultArgs>()({
  select: TILES_FIELDS,
});
type TileWithData = Prisma.TileGetPayload<typeof tileWithDataValidator>;

function formatTile({
  id,
  type,
  position,
  rows,
  columns,
  ...tile
}: TileWithData) {
  const base = { id, position, rows, columns };
  switch (type) {
    case "IMAGE":
      return {
        ...base,
        type,
        ...tile.image!,
      };
    case "VIDEO":
      return {
        ...base,
        type,
        ...tile.video!,
        imageUrl: tile.video!.imageUrl
          ? getVideoImageUrl(tile.video!.id)
          : null,
      };
    case "TEXT":
      return {
        ...base,
        type,
        ...tile.text!,
      };
    case "MAP":
      return {
        ...base,
        type,
        ...tile.map!,
      };
    case "LINK":
      return {
        ...base,
        type,
        ...tile.link!,
        imageUrl: tile.link!.imageUrl ? getLinkImageUrl(tile.link!.id) : null,
      };
    case "HEADING":
      return {
        ...base,
        type,
        ...tile.heading!,
      };
    case "PAGE_LINK": {
      const pageLink = tile.pageLink;
      const page = pageLink?.page;
      if (!pageLink) {
        throw new Error("Page link tile missing page info");
      }
      return {
        ...base,
        type,
        ...pageLink,
        page: page
          ? {
              id: page.id,
              title: page.title,
              subtitle: page.subtitle,
              theme: page.theme,
              hue: page.hue,
              font: page.font,
              author: formatAuthor(page.author),
              imageKey: page.tiles[0]?.image?.imageKey ?? null,
            }
          : null,
      };
    }
    case "EVENT":
      return {
        ...base,
        type,
        ...tile.event!,
        start: tile.event!.start.toISOString(),
        end: tile.event!.end?.toISOString() ?? null,
      };
    case "COLLECTION":
      return {
        ...base,
        type,
        ...tile.collection!,
        // @ts-expect-error Incompatibility due to collections missing
        items: tile.collection!.items.map(formatTile),
      };
    default:
      throw new Error(`Unknown tile type: ${type}`);
  }
}

function formatAuthor({
  id,
  name,
  imageKey,
}: {
  id: string;
  name: string;
  imageKey: string | null;
}) {
  return {
    id,
    name,
    imageUrl: imageKey ? getProfileImageUrl(imageKey) : null,
  };
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
    author: formatAuthor(page.author),
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

export async function getRecentPagesWithTiles(
  { offset }: GetRecentPagesWithTilesSchema,
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
      author: formatAuthor(page.author),
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
      tiles: {
        create: [
          {
            type: "TEXT",
            position: 0,
            rows: 1,
            columns: 3,
            text: {
              create: {
                content: [
                  {
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        text: "This is a new page. You can edit it however you like.",
                        format: 0,
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      },
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
