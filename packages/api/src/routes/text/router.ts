import { router, authenticatedProcedure } from "@/utils/trpc.ts";
import { createText, updateText } from "./text.ts";
import { CreateTextSchema, UpdateTextSchema } from "./schema.ts";
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
