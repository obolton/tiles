import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { CreateSectionSchema, DeleteSectionSchema } from "./schema.ts";
import { createSection, deleteSection } from "./sections.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateSectionSchema)
    .mutation(({ input }) => createSection(input)),

  delete: pageUpdateProcedure
    .input(DeleteSectionSchema)
    .mutation(({ input }) => deleteSection(input)),
});
