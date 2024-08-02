import { Prisma } from "@prisma/client";
import prisma from "@/database/prisma.ts";
import { getProfileImageUrl, getLinkImageUrl } from "@/utils/cdn.ts";
import { PAGE_LINK_TILE_PAGE_FIELDS } from "@/models/tiles/pageLink.ts";
import type {
  GetPageByIdSchema,
  GetProfilePageByUserIdSchema,
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
      id: true,
      imageKey: true,
      caption: true,
    },
  },
  text: {
    select: {
      id: true,
      content: true,
      hue: true,
    },
  },
  place: {
    select: {
      id: true,
      name: true,
      thumbnailKey: true,
      providerId: true,
      lat: true,
      long: true,
      boundingBox: true,
      address: true,
    },
  },
  link: {
    select: {
      id: true,
      url: true,
      title: true,
      description: true,
      siteName: true,
      imageUrl: true,
    },
  },
  heading: {
    select: {
      id: true,
      content: true,
    },
  },
  pageLink: {
    select: {
      id: true,
      pageId: true,
      page: {
        select: PAGE_LINK_TILE_PAGE_FIELDS,
      },
    },
  },
} as const;

const PAGE_FIELDS = {
  id: true,
  title: true,
  subtitle: true,
  hue: true,
  author: {
    select: {
      id: true,
      name: true,
      imageKey: true,
    },
  },
  tiles: {
    select: TILES_FIELDS,
    orderBy: {
      position: "asc",
    },
  },
} as const;

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
    case "PAGE_LINK":
      return {
        ...base,
        type,
        pageLink: tile.pageLink!,
      };
  }
}

export async function getPageById({ id }: GetPageByIdSchema): Promise<{
  id: string;
  title: string;
  subtitle: string | null;
  hue: number | null;
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

  return {
    ...page,
    author: {
      id: page.author.id,
      name: page.author.name,
      imageUrl: page.author.imageKey
        ? getProfileImageUrl(page.author.imageKey)
        : null,
    },
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

export async function getRecentPages(userId: string) {
  const pages = await prisma.page.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 10,
  });
  return pages;
}

export async function createPage(
  authorId: string,
  { title }: CreatePageSchema,
) {
  return prisma.$transaction(async (db) => {
    const page = await db.page.create({
      data: {
        authorId,
        title,
        tiles: {
          create: [
            {
              type: "HEADING",
              position: 0,
              rows: 1,
              columns: 1,
              heading: {
                create: {
                  content: "Welcome to your new page",
                },
              },
            },
            {
              type: "TEXT",
              position: 1,
              rows: 1,
              columns: 3,
              text: {
                create: {
                  content: [
                    {
                      type: "paragraph",
                      spans: [
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
    await db.user.update({
      where: { id: authorId },
      data: {
        profilePage: {
          update: {
            tiles: {
              create: {
                type: "PAGE_LINK",
                position: 0, // TODO
                rows: 1,
                columns: 1,
                pageLink: {
                  create: {
                    pageId: page.id,
                  },
                },
              },
            },
          },
        },
      },
    });
    return page;
  });
}

export async function updatePage({
  id,
  title,
  subtitle,
  hue,
}: UpdatePageSchema) {
  return prisma.page.update({
    where: { id },
    data: { title, subtitle, hue },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      title: true,
      subtitle: true,
      hue: true,
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
