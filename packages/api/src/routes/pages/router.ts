import { router, publicProcedure } from "@/utils/trpc.ts";
import {
  authenticatedWorkspaceProcedure,
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

  list: authenticatedWorkspaceProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listPages(input, ctx)),

  listShared: authenticatedWorkspaceProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listSharedPages(input, ctx)),

  listDeleted: authenticatedWorkspaceProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listDeletedPages(input, ctx)),

  create: authenticatedWorkspaceProcedure
    .input(CreatePageSchema)
    .mutation(async ({ input, ctx }) => createPage(input, ctx)),

  update: pageUpdateProcedure
    .input(UpdatePageSchema)
    .mutation(async ({ input, ctx }) => updatePage(input, ctx)),

  delete: pageUpdateProcedure
    .input(DeletePageSchema)
    .mutation(async ({ input, ctx }) => deletePage(input, ctx)),

  restore: authenticatedWorkspaceProcedure
    .input(RestorePageSchema)
    .mutation(async ({ input, ctx }) => restorePage(input, ctx)),

  emptyTrash: authenticatedWorkspaceProcedure.mutation(async ({ ctx }) =>
    emptyTrash(ctx),
  ),
});
