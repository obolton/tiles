import { router } from "@/utils/trpc";
import { authenticatedProcedure, pageUpdateProcedure } from "@/utils/middleware";
import { generateImage, write } from "./ai";
import { GenerateImageSchema, WriteSchema } from "./schema";

export default router({
  generateImage: authenticatedProcedure
    .input(GenerateImageSchema)
    .mutation(({ input }) => generateImage(input)),

  write: pageUpdateProcedure
    .input(WriteSchema)
    .mutation(({ input, ctx, signal }) => write(input, ctx, signal)),
});
