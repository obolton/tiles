import {
  router,
  publicProcedure,
  authenticatedProcedure,
} from "@/router/trpc.ts";
import {
  GetPageByIdSchema,
  GetProfilePageByUserIdSchema,
  GetRecentPagesWithTilesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "./schema.ts";
import {
  getPageById,
  getProfilePageByUserId,
  getRecentPagesWithTiles,
  createPage,
  updatePage,
  deletePage,
} from "./pages.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  getById: publicProcedure
    .input(GetPageByIdSchema)
    .query(async ({ ctx, input }) => {
      const page = await getPageById(input, ctx.user?.id);
      return page;
    }),

  getProfilePageByUserId: publicProcedure
    .input(GetProfilePageByUserIdSchema)
    .query(async ({ input }) => {
      const page = await getProfilePageByUserId(input);
      return page;
    }),

  getRecentWithTiles: authenticatedProcedure
    .input(GetRecentPagesWithTilesSchema)
    .query(async ({ input, ctx }) => {
      const pages = await getRecentPagesWithTiles(input, ctx);
      return pages;
    }),

  create: authenticatedProcedure
    .input(CreatePageSchema)
    .mutation(async ({ input, ctx }) => {
      const page = await createPage(input, ctx);
      return page;
    }),

  update: authenticatedProcedure
    .input(UpdatePageSchema)
    .mutation(async ({ input, ctx }) => {
      const page = await updatePage(input, ctx);
      invalidateCachedPage(page.id);
      return page;
    }),

  delete: authenticatedProcedure
    .input(DeletePageSchema)
    .mutation(async ({ input, ctx }) => {
      const page = await deletePage(input, ctx);
      invalidateCachedPage(page.id);
      return page;
    }),
});
