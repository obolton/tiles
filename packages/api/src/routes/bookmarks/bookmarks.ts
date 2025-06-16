import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type {
  CreateBookmarkSchema,
  DeleteBookmarkSchema,
  ListBookmarksSchema,
  IsBookmarkedSchema,
} from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { PAGE_LINK_TILE_PAGE_FIELDS } from "../pageLinks/pageLinks.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

const RESULTS_PER_PAGE = 15;

export const BOOKMARK_FIELDS = {
  page: { select: PAGE_LINK_TILE_PAGE_FIELDS },
} as const satisfies Prisma.BookmarkSelect<ExtensionArgs>;

export async function createBookmark(
  { pageId }: CreateBookmarkSchema,
  { userId }: AuthenticatedRequestContext,
) {
  return prisma.bookmark.upsert({
    where: {
      bookmarkId: {
        userId,
        pageId,
      },
    },
    create: {
      userId,
      pageId,
    },
    update: {
      userId,
      pageId,
    },
    select: BOOKMARK_FIELDS,
  });
}

export async function deleteBookmark(
  { pageId }: DeleteBookmarkSchema,
  { userId }: AuthenticatedRequestContext,
) {
  return prisma.bookmark.delete({
    where: {
      bookmarkId: {
        userId,
        pageId,
      },
    },
    select: { pageId: true },
  });
}

export async function listBookmarks(
  { query, offset }: ListBookmarksSchema,
  { userId }: AuthenticatedRequestContext,
) {
  const filter: Prisma.BookmarkWhereInput = query
    ? {
        page: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { subtitle: { contains: query, mode: "insensitive" } },
          ],
        },
      }
    : {};
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      ...filter,
    },
    select: BOOKMARK_FIELDS,
    orderBy: {
      createdAt: "desc",
    },
    take: RESULTS_PER_PAGE + 1,
    skip: offset,
  });
  return {
    pages: bookmarks.slice(0, RESULTS_PER_PAGE).map(({ page }) => page),
    hasMore: bookmarks.length > RESULTS_PER_PAGE,
  };
}

export async function isBookmarked(
  { pageId }: IsBookmarkedSchema,
  { userId }: AuthenticatedRequestContext,
) {
  const count = await prisma.bookmark.count({
    where: {
      userId,
      pageId,
    },
  });
  return count > 0;
}
