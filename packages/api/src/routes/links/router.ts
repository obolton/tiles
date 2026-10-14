import { router } from "@/utils/trpc";
import { authenticatedPageProcedure } from "@/utils/middleware";
import { resolveLinkMetadata } from "./links";
import { GetLinkMetadataSchema } from "./schema";

export default router({
  getMetadata: authenticatedPageProcedure
    .input(GetLinkMetadataSchema)
    .query(({ input, ctx }) => resolveLinkMetadata(input, ctx)),
});
