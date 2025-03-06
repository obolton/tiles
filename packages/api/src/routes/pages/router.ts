import { router, publicProcedure } from "@/utils/trpc.ts";
import {
  authenticatedProcedure,
  pageUpdateProcedure,
} from "@/utils/middleware.ts";
import {
  GetPageByIdSchema,
  GetProfilePageSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
} from "./schema.ts";
import {
  getPageById,
  getProfilePage,
  listPages,
  listSharedPages,
  createPage,
  updatePage,
  deletePage,
} from "./pages.ts";

export default router({
  // TODO: Support server-only procedures
  getById: publicProcedure
    .input(GetPageByIdSchema)
    .query(async ({ ctx, input }) => getPageById(input, ctx.user?.id)),

  getProfilePage: publicProcedure
    .input(GetProfilePageSchema)
    .query(async ({ input }) => getProfilePage(input)),

  list: authenticatedProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listPages(input, ctx)),

  listShared: authenticatedProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listSharedPages(input, ctx)),

  create: authenticatedProcedure
    .input(CreatePageSchema)
    .mutation(async ({ input, ctx }) => createPage(input, ctx)),

  update: pageUpdateProcedure
    .input(UpdatePageSchema)
    .mutation(async ({ input, ctx }) => updatePage(input, ctx)),

  delete: pageUpdateProcedure
    .input(DeletePageSchema)
    .mutation(async ({ input, ctx }) => deletePage(input, ctx)),
});
