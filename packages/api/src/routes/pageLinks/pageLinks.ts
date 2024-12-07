import prisma from "@/database/prisma.ts";
import { Prisma } from "@prisma/client";
import { getProfileImageUrl } from "@/utils/cdn.ts";
import type { CreatePageLinkSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";

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
} as const satisfies Prisma.PageSelect;

export type PageLinkPage = Prisma.PageGetPayload<{
  select: typeof PAGE_LINK_TILE_PAGE_FIELDS;
}>;

export const PAGE_LINK_FIELDS = {
  id: true,
  pageId: true,
  page: {
    select: PAGE_LINK_TILE_PAGE_FIELDS,
  },
} as const satisfies Prisma.PageLinkTileSelect;

export type PageLink = Prisma.PageLinkTileGetPayload<{
  select: typeof PAGE_LINK_FIELDS;
}>;

function formatPage(page: PageLinkPage) {
  const { id, title, subtitle, theme, hue, font, author, tiles } = page;
  return {
    id,
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

export async function createPageLink({
  pageId,
  linkedPageId,
}: CreatePageLinkSchema) {
  if (pageId === linkedPageId) {
    throw new Error("Cannot link to the same page.");
  }
  return prisma.$transaction(async (transaction) => {
    const pageLink = await transaction.pageLinkTile.create({
      data: {
        pageId: linkedPageId,
      },
      select: PAGE_LINK_FIELDS,
    });

    const placement = await createTilePlacement(
      {
        pageId,
        type: "PAGE_LINK",
        pageLinkTileId: pageLink.id,
      },
      transaction,
    );
    return {
      type: "PAGE_LINK" as const,
      ...pageLink,
      page: pageLink.page ? formatPage(pageLink.page) : null,
      ...placement,
    };
  });
}
