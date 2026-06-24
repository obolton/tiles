import { router } from "@/utils/trpc";
import { authenticatedWorkspaceProcedure } from "@/utils/middleware";
import {
  ListThemesSchema,
  CreateThemeSchema,
  UpdateThemeSchema,
  DeleteThemeSchema,
} from "./schema";
import { listThemes, createTheme, updateTheme, deleteTheme } from "./themes";

export default router({
  list: authenticatedWorkspaceProcedure
    .input(ListThemesSchema)
    .query(async ({ input, ctx }) => listThemes(input, ctx)),

  create: authenticatedWorkspaceProcedure
    .input(CreateThemeSchema)
    .mutation(async ({ input, ctx }) => createTheme(input, ctx)),

  update: authenticatedWorkspaceProcedure
    .input(UpdateThemeSchema)
    .mutation(async ({ input, ctx }) => updateTheme(input, ctx)),

  delete: authenticatedWorkspaceProcedure
    .input(DeleteThemeSchema)
    .mutation(async ({ input, ctx }) => deleteTheme(input, ctx)),
});
