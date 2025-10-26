import { router } from "@/utils/trpc";
import { pageUpdateProcedure } from "@/utils/middleware";
import { CreateSectionSchema, UpdateSectionSchema } from "./schema";
import { createSection, updateSection } from "./sections";

export default router({
  create: pageUpdateProcedure
    .input(CreateSectionSchema)
    .mutation(({ input }) => createSection(input)),

  update: pageUpdateProcedure
    .input(UpdateSectionSchema)
    .mutation(({ input }) => updateSection(input)),
});
