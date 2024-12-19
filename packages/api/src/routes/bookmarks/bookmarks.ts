import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type {
  CreateBookmarkSchema,
  DeleteBookmarkSchema,
  ListBookmarksSchema,
  IsBookmarkedSchema,
} from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { PAGE_LINK_TILE_PAGE_FIELDS } from "../pageLinks/pageLinks.ts";
import type { AuthenticatedProcedureContext } from "@/utils/middleware.ts";

export const BOOKMARK_FIELDS = {
  page: { select: PAGE_LINK_TILE_PAGE_FIELDS },
} as const satisfies Prisma.BookmarkSelect<ExtensionArgs>;

export async function createBookmark(
  { pageId }: CreateBookmarkSchema,
  context: AuthenticatedProcedureContext,
) {
  return prisma.bookmark.upsert({
    where: {
      bookmarkId: {
        userId: context.user.id,
        pageId,
      },
    },
    create: {
      userId: context.user.id,
      pageId,
    },
    update: {
      userId: context.user.id,
      pageId,
    },
    select: BOOKMARK_FIELDS,
  });
}

export async function deleteBookmark(
  { pageId }: DeleteBookmarkSchema,
  context: AuthenticatedProcedureContext,
) {
  return prisma.bookmark.delete({
    where: {
      bookmarkId: {
        userId: context.user.id,
        pageId,
      },
    },
    select: { pageId: true },
  });
}

export async function listBookmarks(
  { offset }: ListBookmarksSchema,
  { user }: AuthenticatedProcedureContext,
) {
  const count = 15;
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    select: BOOKMARK_FIELDS,
    orderBy: {
      createdAt: "desc",
    },
    take: count + 1,
    skip: offset,
  });
  return {
    pages: bookmarks.slice(0, count).map(({ page }) => page),
    hasMore: bookmarks.length > count,
  };
}

export async function isBookmarked(
  { pageId }: IsBookmarkedSchema,
  context: AuthenticatedProcedureContext,
) {
  const count = await prisma.bookmark.count({
    where: {
      userId: context.user.id,
      pageId,
    },
  });
  return count > 0;
}
