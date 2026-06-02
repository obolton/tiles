import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { resolveLinkMetadata } from "./links.ts";
import { GetLinkMetadataSchema } from "./schema.ts";

export default router({
  getMetadata: pageUpdateProcedure
    .input(GetLinkMetadataSchema)
    .query(({ input, ctx }) => resolveLinkMetadata(input, ctx)),
});
