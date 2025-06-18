import { router } from "@/utils/trpc.ts";
import {
  authenticatedPageProcedure,
  authenticatedWorkspaceProcedure,
} from "@/utils/middleware.ts";
import {
  createFolder,
  getFolder,
  updateFolder,
  deleteFolder,
  listFolders,
  listPages,
  movePageToFolder,
} from "./folders.ts";
import {
  CreateFolderSchema,
  GetFolderSchema,
  UpdateFolderSchema,
  DeleteFolderSchema,
  ListFoldersSchema,
  ListPagesSchema,
  MovePageToFolderSchema,
} from "./schema.ts";

export default router({
  create: authenticatedWorkspaceProcedure
    .input(CreateFolderSchema)
    .mutation(async ({ input, ctx }) => createFolder(input, ctx)),

  get: authenticatedWorkspaceProcedure
    .input(GetFolderSchema)
    .query(async ({ input, ctx }) => getFolder(input, ctx)),

  update: authenticatedWorkspaceProcedure
    .input(UpdateFolderSchema)
    .mutation(({ input, ctx }) => updateFolder(input, ctx)),

  delete: authenticatedWorkspaceProcedure
    .input(DeleteFolderSchema)
    .mutation(({ input, ctx }) => deleteFolder(input, ctx)),

  list: authenticatedWorkspaceProcedure
    .input(ListFoldersSchema)
    .query(async ({ input, ctx }) => listFolders(input, ctx)),

  listPages: authenticatedWorkspaceProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listPages(input, ctx)),

  movePage: authenticatedPageProcedure
    .concat(authenticatedWorkspaceProcedure)
    .input(MovePageToFolderSchema)
    .mutation(({ input, ctx }) => movePageToFolder(input, ctx)),
});
