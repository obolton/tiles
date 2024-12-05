import { router, authenticatedProcedure } from "./trpc.ts";
import { createPageLink } from "@/models/pageLinks/pageLinks.ts";
import { CreatePageLinkSchema } from "@/models/pageLinks/schema.ts";
import { invalidateCachedPage } from "@/utils/cdn.ts";

export default router({
  create: authenticatedProcedure
    .input(CreatePageLinkSchema)
    .mutation(async ({ input }) => {
      const pageLink = await createPageLink(input);
      invalidateCachedPage(input.pageId);
      return pageLink;
    }),
});
