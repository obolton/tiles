import { router, authenticatedProcedure } from "@/router/trpc.ts";
import { createPageLink } from "./pageLinks.ts";
import { CreatePageLinkSchema } from "./schema.ts";
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
