import prisma, { type ExtensionArgs } from "@/database/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const PAGE_LINK_TILE_PAGE_FIELDS = {
  id: true,
  title: true,
  background: true,
  font: true,
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
