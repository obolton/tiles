import { router } from "@/utils/trpc.ts";
import {
  authenticatedProcedure,
  authenticatedPageProcedure,
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
  create: authenticatedProcedure
    .input(CreateFolderSchema)
    .mutation(async ({ input, ctx }) => createFolder(input, ctx)),

  get: authenticatedProcedure
    .input(GetFolderSchema)
    .query(async ({ input, ctx }) => getFolder(input, ctx)),

  update: authenticatedProcedure
    .input(UpdateFolderSchema)
    .mutation(({ input, ctx }) => updateFolder(input, ctx)),

  delete: authenticatedProcedure
    .input(DeleteFolderSchema)
    .mutation(({ input, ctx }) => deleteFolder(input, ctx)),

  list: authenticatedProcedure
    .input(ListFoldersSchema)
    .query(async ({ input, ctx }) => listFolders(input, ctx)),

  listPages: authenticatedProcedure
    .input(ListPagesSchema)
    .query(async ({ input, ctx }) => listPages(input, ctx)),

  movePage: authenticatedPageProcedure
    .input(MovePageToFolderSchema)
    .mutation(({ input, ctx }) => movePageToFolder(input, ctx)),
});
