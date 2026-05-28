import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createLink, resolveLinkMetadata, updateLink } from "./links.ts";
import {
  CreateLinkSchema,
  GetLinkMetadataSchema,
  UpdateLinkSchema,
} from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateLinkSchema)
    .mutation(({ input, ctx }) => createLink(input, ctx)),

  update: pageUpdateProcedure
    .input(UpdateLinkSchema)
    .mutation(({ input, ctx }) => updateLink(input, ctx)),

  getMetadata: pageUpdateProcedure
    .input(GetLinkMetadataSchema)
    .query(({ input, ctx }) => resolveLinkMetadata(input, ctx)),
});
