import { router } from "@/utils/trpc.ts";
import { authenticatedProcedure } from "@/utils/middleware.ts";
import { generateImage } from "./ai.ts";
import { GenerateImageSchema } from "./schema.ts";

export default router({
  generateImage: authenticatedProcedure
    .input(GenerateImageSchema)
    .mutation(({ input }) => generateImage(input)),
});
