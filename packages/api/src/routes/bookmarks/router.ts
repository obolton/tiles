import { router, authenticatedProcedure } from "@/utils/trpc.ts";
import {
  createBookmark,
  deleteBookmark,
  listBookmarks,
  isBookmarked,
} from "./bookmarks.ts";
import {
  CreateBookmarkSchema,
  DeleteBookmarkSchema,
  ListBookmarksSchema,
  IsBookmarkedSchema,
} from "./schema.ts";

export default router({
  list: authenticatedProcedure
    .input(ListBookmarksSchema)
    .query(async ({ input, ctx }) => {
      const result = await listBookmarks(input, ctx);
      return result;
    }),

  isBookmarked: authenticatedProcedure
    .input(IsBookmarkedSchema)
    .query(async ({ input, ctx }) => {
      const result = await isBookmarked(input, ctx);
      return result;
    }),

  create: authenticatedProcedure
    .input(CreateBookmarkSchema)
    .mutation(async ({ input, ctx }) => {
      const bookmark = await createBookmark(input, ctx);
      return bookmark;
    }),

  delete: authenticatedProcedure
    .input(DeleteBookmarkSchema)
    .mutation(async ({ input, ctx }) => {
      const bookmark = deleteBookmark(input, ctx);
      return bookmark;
    }),
});
