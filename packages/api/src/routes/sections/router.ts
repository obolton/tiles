import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import {
  CreateSectionSchema,
  UpdateSectionSchema,
  DuplicateSectionSchema,
  DeleteSectionSchema,
} from "./schema.ts";
import {
  createSection,
  updateSection,
  duplicateSection,
  deleteSection,
} from "./sections.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateSectionSchema)
    .mutation(({ input }) => createSection(input)),

  update: pageUpdateProcedure
    .input(UpdateSectionSchema)
    .mutation(({ input }) => updateSection(input)),

  duplicate: pageUpdateProcedure
    .input(DuplicateSectionSchema)
    .mutation(({ input }) => duplicateSection(input)),

  delete: pageUpdateProcedure
    .input(DeleteSectionSchema)
    .mutation(({ input }) => deleteSection(input)),
});
