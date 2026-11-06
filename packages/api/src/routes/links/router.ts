import { router } from "@/utils/trpc";
import { pageUpdateProcedure } from "@/utils/middleware";
import { resolveLinkMetadata, resolveVideoMetadata } from "./links";
import { GetLinkMetadataSchema } from "./schema";

export default router({
  getMetadata: pageUpdateProcedure
    .input(GetLinkMetadataSchema)
    .query(({ input, ctx }) => resolveLinkMetadata(input, ctx)),

  getVideoMetadata: pageUpdateProcedure
    .input(GetLinkMetadataSchema)
    .query(({ input }) => resolveVideoMetadata(input)),
});
