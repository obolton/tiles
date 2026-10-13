import { router } from "@/utils/trpc";
import { authenticatedProcedure, authenticatedPageProcedure } from "@/utils/middleware";
import { createBookmark, deleteBookmarks, listBookmarks, isBookmarked } from "./bookmarks";
import {
  CreateBookmarkSchema,
  DeleteBookmarkSchema,
  ListBookmarksSchema,
  IsBookmarkedSchema,
} from "./schema";

export default router({
  list: authenticatedProcedure
    .input(ListBookmarksSchema)
    .query(async ({ input, ctx }) => listBookmarks(input, ctx)),

  isBookmarked: authenticatedProcedure
    .input(IsBookmarkedSchema)
    .query(async ({ input, ctx }) => isBookmarked(input, ctx)),

  create: authenticatedPageProcedure
    .input(CreateBookmarkSchema)
    .mutation(async ({ input, ctx }) => createBookmark(input, ctx)),

  delete: authenticatedProcedure
    .input(DeleteBookmarkSchema)
    .mutation(({ input, ctx }) => deleteBookmarks(input, ctx)),
});
