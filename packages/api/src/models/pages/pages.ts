import { Prisma } from "@prisma/client";
import type { Theme, Font } from "@prisma/client";
import prisma from "@/database/prisma.ts";
import {
  getProfileImageUrl,
  getLinkImageUrl,
  getVideoImageUrl,
} from "@/utils/cdn.ts";
import { PAGE_LINK_TILE_PAGE_FIELDS } from "@/models/tiles/pageLink.ts";
import { COLLECTION_TILE_FIELDS } from "@/models/tiles/collection.ts";
import type {
  GetPageByIdSchema,
  GetProfilePageByUserIdSchema,
  GetRecentPagesWithTilesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "./schema.ts";
import type { ClientTile } from "@/types/tiles.ts";

const TILES_FIELDS = {
  id: true,
  type: true,
  position: true,
  columns: true,
  rows: true,
  image: {
    select: {
      imageKey: true,
      caption: true,
      originX: true,
      originY: true,
    },
  },
  video: {
    select: {
      videoType: true,
      videoId: true,
      imageUrl: true,
      title: true,
      description: true,
    },
  },
  text: {
    select: {
      content: true,
      theme: true,
      hue: true,
    },
  },
  place: {
    select: {
      id: true,
      name: true,
      providerId: true,
      lat: true,
      long: true,
      boundingBox: true,
      address: true,
    },
  },
  map: {
    select: {
      places: {
        select: {
          id: true,
          name: true,
          providerId: true,
          lat: true,
          long: true,
          boundingBox: true,
          address: true,
        },
      },
    },
  },
  link: {
    select: {
      url: true,
      title: true,
      description: true,
      siteName: true,
      imageUrl: true,
    },
  },
  heading: {
    select: {
      content: true,
    },
  },
  pageLink: {
    select: {
      pageId: true,
      page: {
        select: PAGE_LINK_TILE_PAGE_FIELDS,
      },
    },
  },
  event: {
    select: {
      title: true,
      start: true,
      end: true,
      allDay: true,
      timeZone: true,
    },
  },
  collection: {
    select: COLLECTION_TILE_FIELDS,
  },
} as const;

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
        image: tile.image!,
      };
    case "VIDEO":
      return {
        ...base,
        type,
        video: {
          ...tile.video!,
          imageUrl: tile.video!.imageUrl ? getVideoImageUrl(id) : null,
        },
      };
    case "TEXT":
      return {
        ...base,
        type,
        text: tile.text!,
      };
    case "PLACE":
      return {
        ...base,
        type,
        place: tile.place!,
      };
    case "MAP":
      return {
        ...base,
        type,
        map: tile.map!,
      };
    case "LINK":
      return {
        ...base,
        type,
        link: {
          ...tile.link!,
          imageUrl: tile.link!.imageUrl ? getLinkImageUrl(id) : null,
        },
      };
    case "HEADING":
      return {
        ...base,
        type,
        heading: tile.heading!,
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
        pageLink: {
          pageId: pageLink.pageId,
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
        },
      };
    }
    case "EVENT":
      return {
        ...base,
        type,
        event: {
          ...tile.event!,
          start: tile.event!.start.toISOString(),
          end: tile.event!.end?.toISOString() ?? null,
        },
      };
    case "COLLECTION":
      return {
        ...base,
        type,
        collection: tile.collection!,
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
  userId: string,
  { offset }: GetRecentPagesWithTilesSchema,
) {
  const count = 15;
  const pages = await prisma.page.findMany({
    where: { authorId: userId },
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
  authorId: string,
  { title }: CreatePageSchema,
) {
  return prisma.page.create({
    data: {
      authorId,
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

export async function updatePage({
  id,
  published,
  title,
  subtitle,
  theme,
  hue,
  font,
}: UpdatePageSchema) {
  return prisma.page.update({
    where: { id },
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

export async function deletePage({ id }: DeletePageSchema) {
  return prisma.page.delete({
    where: { id },
    select: {
      id: true,
    },
  });
}
