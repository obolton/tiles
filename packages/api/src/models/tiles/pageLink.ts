import { Prisma } from "@prisma/client";
import { getProfileImageUrl } from "@/utils/cdn.ts";
import type { PageLinkTileSchema } from "./schema.ts";

export const PAGE_LINK_TILE_PAGE_FIELDS = {
  id: true,
  title: true,
  subtitle: true,
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
    where: { type: "IMAGE" },
    select: {
      image: {
        select: {
          imageKey: true,
        },
      },
    },
    orderBy: {
      position: "asc",
    },
    take: 1,
  },
} as const;

const pageValidator = Prisma.validator<Prisma.PageDefaultArgs>()({
  select: PAGE_LINK_TILE_PAGE_FIELDS,
});
type Page = Prisma.PageGetPayload<typeof pageValidator>;

function formatPage(page: Page) {
  const { title, subtitle, theme, hue, font, author, tiles } = page;
  return {
    title,
    subtitle,
    theme,
    hue,
    font,
    author: {
      id: author.id,
      name: author.name,
      imageUrl: author.imageKey ? getProfileImageUrl(author.imageKey) : null,
    },
    imageKey: tiles[0]?.image?.imageKey ?? null,
  };
}

export async function createPageLinkTile(
  db: Prisma.TransactionClient,
  pageId: string,
  { pageLink: { pageId: linkedPageId } }: PageLinkTileSchema,
  position: number,
) {
  if (pageId === linkedPageId) {
    throw new Error("Cannot link to the same page.");
  }
  const pageLinkTile = await db.pageLinkTile.create({
    data: {
      pageId: linkedPageId,
    },
    select: {
      id: true,
    },
  });
  const tile = await db.tile.create({
    data: {
      pageId,
      type: "PAGE_LINK",
      position,
      columns: 1,
      rows: 1,
      pageLinkTileId: pageLinkTile.id,
    },
    select: {
      id: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      pageLink: {
        select: {
          pageId: true,
          page: {
            select: PAGE_LINK_TILE_PAGE_FIELDS,
          },
        },
      },
    },
  });

  return {
    ...tile,
    pageLink: {
      ...tile.pageLink,
      page: tile.pageLink?.page ? formatPage(tile.pageLink.page) : null,
    },
  };
}

export async function updatePageLinkTile(
  db: Prisma.TransactionClient,
  id: string,
  { pageLink: { pageId: linkedPageId } }: PageLinkTileSchema,
) {
  const tile = await db.tile.update({
    where: {
      id,
    },
    data: {
      pageLink: {
        update: {
          pageId: linkedPageId,
        },
      },
    },
    select: {
      id: true,
      pageId: true,
      type: true,
      position: true,
      columns: true,
      rows: true,
      pageLink: {
        select: {
          pageId: true,
          page: {
            select: PAGE_LINK_TILE_PAGE_FIELDS,
          },
        },
      },
    },
  });

  return {
    ...tile,
    pageLink: {
      ...tile.pageLink,
      page: tile.pageLink?.page ? formatPage(tile.pageLink.page) : null,
    },
  };
}
