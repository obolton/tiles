import { router, authenticatedProcedure } from "./trpc.ts";
import { createLink, updateLink } from "@/models/links/links.ts";
import { CreateLinkSchema, UpdateLinkSchema } from "@/models/links/schema.ts";
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
