import { router } from "@/utils/trpc";
import { authenticatedWorkspaceProcedure } from "@/utils/middleware";
import {
  createFolder,
  getFolder,
  updateFolder,
  deleteFolder,
  listFolders,
  listPages,
} from "./folders";
import {
  CreateFolderSchema,
  GetFolderSchema,
  UpdateFolderSchema,
  DeleteFolderSchema,
  ListFoldersSchema,
  ListPagesSchema,
} from "./schema";

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
});
