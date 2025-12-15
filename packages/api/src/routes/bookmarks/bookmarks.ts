import prisma, { type ExtensionArgs } from "@/database/prisma.ts";
import type {
  CreateBookmarkSchema,
  DeleteBookmarkSchema,
  ListBookmarksSchema,
  IsBookmarkedSchema,
} from "./schema.ts";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_LINK_TILE_PAGE_FIELDS } from "../pageLinks/pageLinks.ts";
import { RESULTS_PER_PAGE, paginate } from "@/utils/pagination";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

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
  { query, cursor }: ListBookmarksSchema,
  { userId }: AuthenticatedRequestContext,
) {
  const filter: Prisma.BookmarkWhereInput = query
    ? {
        page: {
          title: { contains: query, mode: "insensitive" },
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
    ...(cursor && {
      cursor: { bookmarkId: { userId, pageId: cursor } },
      skip: 1,
    }),
  });
  const { items, nextCursor } = paginate(bookmarks, (b) => b.page.id);
  return {
    pages: items.map(({ page }) => page),
    nextCursor,
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
