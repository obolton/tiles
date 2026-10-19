import { describe, test, expect, vi, beforeEach } from "vitest";
import prisma from "@/database/prisma";
import { createBookmark, deleteBookmarks, listBookmarks, isBookmarked } from "../bookmarks";
import { BOOKMARK_FIELDS } from "../fields";
import type { LibraryPage } from "@/routes/pages/fields";
import { RESULTS_PER_PAGE } from "@/utils/pagination";
import type { FindManyQuery } from "@/test/prisma";
import type { AuthenticatedRequestContext } from "@/utils/trpc";

const MOCK_CONTEXT: AuthenticatedRequestContext = {
  res: {} as AuthenticatedRequestContext["res"],
  sessionId: "session-1",
  userId: "user-1",
  isService: false,
};

type UpsertQuery<T> = { select: T; where: never; create: never; update: never };

function createMockPage(index: number): LibraryPage {
  return {
    id: `page-${index}`,
    title: `Page ${index}`,
    type: "DOCUMENT",
    updatedAt: new Date(),
    published: false,
    folderId: null,
    author: { id: "user-1", name: "Alice", imageUrl: null },
    folder: null,
  };
}

function createMockBookmarks(count: number) {
  return Array.from({ length: count }, (_, i) => ({ page: createMockPage(i + 1) }));
}

describe("createBookmark", () => {
  const MOCK_BOOKMARK = { page: createMockPage(1) };

  beforeEach(() => {
    vi.mocked(prisma.bookmark.upsert<UpsertQuery<typeof BOOKMARK_FIELDS>>).mockResolvedValue(
      MOCK_BOOKMARK,
    );
  });

  test("upserts the bookmark for the current user and page", async () => {
    const result = await createBookmark({ pageId: "page-1" }, MOCK_CONTEXT);

    expect(prisma.bookmark.upsert).toHaveBeenCalledWith({
      where: { bookmarkId: { userId: "user-1", pageId: "page-1" } },
      create: { userId: "user-1", pageId: "page-1" },
      update: { userId: "user-1", pageId: "page-1" },
      select: BOOKMARK_FIELDS,
    });
    expect(result).toEqual(MOCK_BOOKMARK);
  });
});

describe("deleteBookmarks", () => {
  beforeEach(() => {
    vi.mocked(prisma.bookmark.deleteMany).mockResolvedValue({ count: 2 });
  });

  test("deletes the given bookmarks scoped to the current user", async () => {
    const result = await deleteBookmarks({ pageIds: ["page-1", "page-2"] }, MOCK_CONTEXT);

    expect(prisma.bookmark.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", pageId: { in: ["page-1", "page-2"] } },
    });
    expect(result).toEqual({ count: 2 });
  });
});

describe("listBookmarks", () => {
  const findMany = vi.mocked(prisma.bookmark.findMany<FindManyQuery<typeof BOOKMARK_FIELDS>>);

  beforeEach(() => {
    findMany.mockResolvedValue([]);
  });

  test("lists the current user's bookmarks, newest first", async () => {
    await listBookmarks({}, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: BOOKMARK_FIELDS,
      orderBy: { createdAt: "desc" },
      take: RESULTS_PER_PAGE + 1,
    });
  });

  test("filters by page title when a query is given", async () => {
    await listBookmarks({ query: "plan" }, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          page: { title: { contains: "plan", mode: "insensitive" } },
        },
      }),
    );
  });

  test("resumes from the composite cursor when one is given", async () => {
    await listBookmarks({ cursor: "page-5" }, MOCK_CONTEXT);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { bookmarkId: { userId: "user-1", pageId: "page-5" } },
        skip: 1,
      }),
    );
  });

  test("returns the bookmarked pages with no cursor when there are no more results", async () => {
    const bookmarks = createMockBookmarks(RESULTS_PER_PAGE);
    findMany.mockResolvedValue(bookmarks);

    const result = await listBookmarks({}, MOCK_CONTEXT);

    expect(result).toEqual({
      pages: bookmarks.map(({ page }) => page),
      nextCursor: null,
    });
  });

  test("trims the extra result and uses the last page id as the next cursor", async () => {
    const bookmarks = createMockBookmarks(RESULTS_PER_PAGE + 1);
    findMany.mockResolvedValue(bookmarks);

    const result = await listBookmarks({}, MOCK_CONTEXT);

    expect(result.pages).toEqual(bookmarks.slice(0, RESULTS_PER_PAGE).map(({ page }) => page));
    expect(result.nextCursor).toBe(`page-${RESULTS_PER_PAGE}`);
  });
});

describe("isBookmarked", () => {
  test("counts bookmarks for the current user and page", async () => {
    await isBookmarked({ pageId: "page-1" }, MOCK_CONTEXT);

    expect(prisma.bookmark.count).toHaveBeenCalledWith({
      where: { userId: "user-1", pageId: "page-1" },
    });
  });

  test("returns true when a bookmark exists", async () => {
    vi.mocked(prisma.bookmark.count).mockResolvedValueOnce(1);

    await expect(isBookmarked({ pageId: "page-1" }, MOCK_CONTEXT)).resolves.toBe(true);
  });

  test("returns false when no bookmark exists", async () => {
    vi.mocked(prisma.bookmark.count).mockResolvedValueOnce(0);

    await expect(isBookmarked({ pageId: "page-1" }, MOCK_CONTEXT)).resolves.toBe(false);
  });
});
