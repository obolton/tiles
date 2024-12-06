import { router, authenticatedProcedure } from "@/router/trpc.ts";
import { createLink, updateLink } from "./links.ts";
import { CreateLinkSchema, UpdateLinkSchema } from "./schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreateLinkSchema)
    .mutation(async ({ input }) => {
      const link = await createLink(input);
      invalidateCachedPage(input.pageId);
      return link;
    }),

  update: authenticatedProcedure
    .input(UpdateLinkSchema)
    .mutation(async ({ input }) => {
      const link = updateLink(input);
      // invalidateCachedPage(input.pageId); TODO
      return link;
    }),
});
