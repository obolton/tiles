import { router } from "@/utils/trpc";
import { pageUpdateProcedure } from "@/utils/middleware";
import { CreateSectionSchema } from "./schema";
import { createSection } from "./sections";

export default router({
  create: pageUpdateProcedure
    .input(CreateSectionSchema)
    .mutation(({ input }) => createSection(input)),
});
