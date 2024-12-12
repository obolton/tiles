import prisma from "@/database/prisma.ts";
import type {
  CreateBookmarkSchema,
  DeleteBookmarkSchema,
  ListBookmarksSchema,
  IsBookmarkedSchema,
} from "./schema.ts";
import type { Prisma } from "@prisma/client";
import { PAGE_LINK_TILE_PAGE_FIELDS } from "../pageLinks/pageLinks.ts";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";
import { checkPageAccess } from "@/utils/permissions.ts";

export const BOOKMARK_FIELDS = {
  page: { select: PAGE_LINK_TILE_PAGE_FIELDS },
} as const satisfies Prisma.BookmarkSelect;

export type Bookmark = Prisma.BookmarkGetPayload<{
  select: typeof BOOKMARK_FIELDS;
}>;

export async function createBookmark(
  { pageId }: CreateBookmarkSchema,
  context: AuthenticatedRequestContext,
) {
  return prisma.$transaction(async (transaction) => {
    await checkPageAccess(transaction, context, pageId);
    return transaction.bookmark.create({
      data: {
        userId: context.user.id,
        pageId,
      },
      select: BOOKMARK_FIELDS,
    });
  });
}

export async function deleteBookmark(
  { pageId }: DeleteBookmarkSchema,
  context: AuthenticatedRequestContext,
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
  { user }: AuthenticatedRequestContext,
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
    pages: bookmarks.slice(0, count).map(({ page }) => ({
      id: page.id,
      title: page.title,
      subtitle: page.subtitle,
      theme: page.theme,
      hue: page.hue,
      font: page.font,
      author: page.author,
      imageKey: page.tiles[0]?.image?.imageKey ?? null,
    })),
    hasMore: bookmarks.length > count,
  };
}

export async function isBookmarked(
  { pageId }: IsBookmarkedSchema,
  context: AuthenticatedRequestContext,
) {
  const count = await prisma.bookmark.count({
    where: {
      userId: context.user.id,
      pageId,
    },
  });
  return count > 0;
}
