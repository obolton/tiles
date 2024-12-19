import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createPageLink } from "./pageLinks.ts";
import { CreatePageLinkSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreatePageLinkSchema)
    .mutation(({ input }) => createPageLink(input)),
});
