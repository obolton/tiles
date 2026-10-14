import { router, publicProcedure } from "@/utils/trpc";
import { authenticatedWorkspaceProcedure, pageUpdateProcedure } from "@/utils/middleware";
import {
  GetPageByIdSchema,
  ListPagesSchema,
  CreatePageSchema,
  UpdatePageSchema,
  DeletePageSchema,
  RestorePageSchema,
  MovePagesSchema,
} from "./schema";
import {
  getPageById,
  listPages,
  listSharedPages,
  listDeletedPages,
  createPage,
  updatePage,
  deletePages,
  restorePages,
  movePages,
  emptyTrash,
} from "./pages";

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

  delete: authenticatedWorkspaceProcedure
    .input(DeletePageSchema)
    .mutation(async ({ input, ctx }) => deletePages(input, ctx)),

  restore: authenticatedWorkspaceProcedure
    .input(RestorePageSchema)
    .mutation(async ({ input, ctx }) => restorePages(input, ctx)),

  move: authenticatedWorkspaceProcedure
    .input(MovePagesSchema)
    .mutation(async ({ input, ctx }) => movePages(input, ctx)),

  emptyTrash: authenticatedWorkspaceProcedure.mutation(async ({ ctx }) => emptyTrash(ctx)),
});
