import { router } from "@/utils/trpc.ts";
import { authenticatedProcedure, pageUpdateProcedure } from "@/utils/middleware.ts";
import { generateImage, write } from "./ai.ts";
import { GenerateImageSchema, WriteSchema } from "./schema.ts";

export default router({
  generateImage: authenticatedProcedure
    .input(GenerateImageSchema)
    .mutation(({ input }) => generateImage(input)),

  write: pageUpdateProcedure
    .input(WriteSchema)
    .mutation(({ input, ctx, signal }) => write(input, ctx, signal)),
});
