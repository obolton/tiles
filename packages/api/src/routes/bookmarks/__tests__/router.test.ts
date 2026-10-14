import { vi } from "vitest";
import { createBookmark, deleteBookmarks, listBookmarks, isBookmarked } from "../bookmarks";
import { describeRouter } from "@/test/router";
import { PAGE_ID } from "@/test/mocks/middleware";

vi.mock("../bookmarks");
vi.mock("@/utils/cdn", () => ({ invalidateCachedPages: vi.fn() }));

describeRouter("bookmarks", {
  list: {
    guard: "authenticated",
    handler: listBookmarks,
    input: {},
    invalid: { query: "" },
  },
  isBookmarked: {
    guard: "authenticated",
    handler: isBookmarked,
    input: { pageId: PAGE_ID },
    invalid: { pageId: "not-a-uuid" },
  },
  create: {
    guard: "page",
    handler: createBookmark,
    input: { pageId: PAGE_ID },
    invalid: { pageId: "not-a-uuid" },
  },
  delete: {
    guard: "authenticated",
    handler: deleteBookmarks,
    input: { pageIds: [PAGE_ID] },
    invalid: { pageIds: [] },
  },
});
