import { router, publicProcedure, authenticatedProcedure } from "./trpc.ts";
import {
  GetPageByIdSchema,
  GetProfilePageByUserIdSchema,
  GetRecentPagesWithTilesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "@/models/pages/schema.ts";
import {
  getPageById,
  getProfilePageByUserId,
  getRecentPagesWithTiles,
  createPage,
  updatePage,
  deletePage,
} from "@/models/pages/pages.ts";
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
      const pages = await getRecentPagesWithTiles(ctx.user.id, input);
      return pages;
    }),

  create: authenticatedProcedure
    .input(CreatePageSchema)
    .mutation(async ({ input, ctx }) => {
      const page = await createPage(ctx.user.id, input);
      return page;
    }),

  update: authenticatedProcedure
    .input(UpdatePageSchema)
    .mutation(async ({ input }) => {
      const page = await updatePage(input);
      invalidateCachedPage(page.id);
      return page;
    }),

  delete: authenticatedProcedure
    .input(DeletePageSchema)
    .mutation(async ({ input }) => {
      const page = await deletePage(input);
      invalidateCachedPage(page.id);
      return page;
    }),
});
