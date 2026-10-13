import { router } from "@/utils/trpc";
import { authenticatedPageProcedure, authenticatedWorkspaceProcedure } from "@/utils/middleware";
import {
  ListVersionsSchema,
  GetVersionSchema,
  CreateVersionSchema,
  PrepareRestoreSchema,
  RenameVersionSchema,
  DeleteVersionSchema,
  CopyVersionSchema,
} from "./schema";
import {
  listVersions,
  getVersion,
  createNamedVersion,
  prepareRestore,
  renameVersion,
  deleteVersion,
  copyVersionToPage,
} from "./versions";

export default router({
  list: authenticatedPageProcedure
    .input(ListVersionsSchema)
    .query(async ({ input }) => listVersions(input)),

  get: authenticatedPageProcedure
    .input(GetVersionSchema)
    .query(async ({ input }) => getVersion(input)),

  create: authenticatedPageProcedure
    .input(CreateVersionSchema)
    .mutation(async ({ input, ctx }) => createNamedVersion(input, ctx)),

  prepareRestore: authenticatedPageProcedure
    .input(PrepareRestoreSchema)
    .mutation(async ({ input, ctx }) => prepareRestore(input, ctx)),

  rename: authenticatedPageProcedure
    .input(RenameVersionSchema)
    .mutation(async ({ input }) => renameVersion(input)),

  delete: authenticatedPageProcedure
    .input(DeleteVersionSchema)
    .mutation(async ({ input }) => deleteVersion(input)),

  copyToPage: authenticatedWorkspaceProcedure
    .input(CopyVersionSchema)
    .mutation(async ({ input, ctx }) => copyVersionToPage(input, ctx)),
});
