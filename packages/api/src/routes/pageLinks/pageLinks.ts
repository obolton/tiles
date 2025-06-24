import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import { Prisma } from "@prisma/client";
import type { CreatePageLinkSchema } from "./schema.ts";
import { createTilePlacement } from "../tiles/tiles.ts";

export const PAGE_LINK_TILE_PAGE_FIELDS = {
  id: true,
  title: true,
  color: true,
  font: true,
  coverImageUrl: true,
  author: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  },
} as const satisfies Prisma.Args<typeof prisma.page, "findMany">["select"];

export type PageLinkPage = Prisma.Result<
  typeof prisma.page,
  { select: typeof PAGE_LINK_TILE_PAGE_FIELDS },
  "findUniqueOrThrow"
>;

export const PAGE_LINK_FIELDS = {
  id: true,
  linkedPage: {
    select: PAGE_LINK_TILE_PAGE_FIELDS,
  },
} as const satisfies Prisma.PageLinkTileSelect<ExtensionArgs>;

export type PageLink = Prisma.Result<
  typeof prisma.pageLinkTile,
  { select: typeof PAGE_LINK_FIELDS },
  "findUniqueOrThrow"
>;

export async function createPageLink({
  pageId,
  collectionId,
  linkedPageId,
}: CreatePageLinkSchema) {
  if (pageId === linkedPageId) {
    throw new Error("Cannot link to the same page.");
  }
  return prisma.$transaction(async (transaction) => {
    const pageLink = await transaction.pageLinkTile.create({
      data: {
        pageId,
        linkedPageId,
      },
      select: PAGE_LINK_FIELDS,
    });

    const placement = await createTilePlacement(
      {
        pageId,
        parentCollectionId: collectionId,
        type: "PAGE_LINK",
        pageLinkTileId: pageLink.id,
      },
      transaction,
    );
    return {
      type: "PAGE_LINK" as const,
      ...pageLink,
      ...placement,
    };
  });
}
