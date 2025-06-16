import { router, publicProcedure } from "@/utils/trpc.ts";
import {
  authenticatedProcedure,
  pageUpdateProcedure,
} from "@/utils/middleware.ts";
import {
  GetPageByIdSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
  RestorePageSchema,
} from "./schema.ts";
import {
  getPageById,
  listPages,
  listSharedPages,
  listDeletedPages,
  createPage,
  updatePage,
  deletePage,
  restorePage,
  emptyTrash,
} from "./pages.ts";

export default router({
  // TODO: Support server-only procedures
  getById: publicProcedure
    .input(GetPageByIdSchema)
    .query(async ({ ctx, input }) => getPageById(input, ctx)),

  list: authenticatedProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listPages(input, ctx)),

  listShared: authenticatedProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listSharedPages(input, ctx)),

  listDeleted: authenticatedProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listDeletedPages(input, ctx)),

  create: authenticatedProcedure
    .input(CreatePageSchema)
    .mutation(async ({ input, ctx }) => createPage(input, ctx)),

  update: pageUpdateProcedure
    .input(UpdatePageSchema)
    .mutation(async ({ input, ctx }) => updatePage(input, ctx)),

  delete: pageUpdateProcedure
    .input(DeletePageSchema)
    .mutation(async ({ input, ctx }) => deletePage(input, ctx)),

  restore: authenticatedProcedure
    .input(RestorePageSchema)
    .mutation(async ({ input, ctx }) => restorePage(input, ctx)),

  emptyTrash: authenticatedProcedure.mutation(async ({ ctx }) =>
    emptyTrash(ctx),
  ),
});
