import { router, authenticatedProcedure } from "./trpc.ts";
import { createText, updateText } from "@/models/text/text.ts";
import { CreateTextSchema, UpdateTextSchema } from "@/models/text/schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateTextSchema)
    .mutation(async ({ input }) => {
      const text = await createText(input);
      invalidateCachedPage(input.pageId);
      return text;
    }),

  update: authenticatedProcedure
    .input(UpdateTextSchema)
    .mutation(async ({ input }) => {
      const text = updateText(input);
      // invalidateCachedPage(input.pageId); TODO
      return text;
    }),
});
