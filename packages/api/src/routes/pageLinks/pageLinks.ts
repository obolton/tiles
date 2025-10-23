import prisma, { type ExtensionArgs } from "@/database/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { CreatePageLinkSchema } from "./schema";
import { createTile } from "../tiles/tiles";

export const PAGE_LINK_TILE_PAGE_FIELDS = {
  id: true,
  title: true,
  background: true,
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
  sectionId,
  linkedPageId,
  ...properties
}: CreatePageLinkSchema) {
  if (pageId === linkedPageId) {
    throw new Error("Cannot link to the same page.");
  }

  const { pageLink, ...tile } = await createTile(
    {
      ...properties,
      type: "PAGE_LINK",
      pageId,
      sectionId,
      pageLink: {
        pageId,
        linkedPageId,
      },
    },
    { pageLink: { select: PAGE_LINK_FIELDS } },
    prisma,
  );

  return { ...tile, ...pageLink };
}
