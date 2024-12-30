import { router, publicProcedure } from "@/utils/trpc.ts";
import {
  authenticatedProcedure,
  pageUpdateProcedure,
} from "@/utils/middleware.ts";
import {
  GetPageByIdSchema,
  GetProfilePageByUserIdSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "./schema.ts";
import {
  getPageById,
  getProfilePageByUserId,
  listPages,
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

  list: authenticatedProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => {
      const pages = await listPages(input, ctx);
      return pages;
    }),

  create: authenticatedProcedure
    .input(CreatePageSchema)
    .mutation(async ({ input, ctx }) => {
      const page = await createPage(input, ctx);
      return page;
    }),

  update: pageUpdateProcedure
    .input(UpdatePageSchema)
    .mutation(async ({ input, ctx }) => {
      const page = await updatePage(input, ctx);
      invalidateCachedPage(page.id);
      return page;
    }),

  delete: pageUpdateProcedure
    .input(DeletePageSchema)
    .mutation(async ({ input, ctx }) => {
      const page = await deletePage(input, ctx);
      invalidateCachedPage(page.id);
      return page;
    }),
});
