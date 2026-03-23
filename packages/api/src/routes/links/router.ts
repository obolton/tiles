import { router } from "@/utils/trpc.ts";
import { pageUpdateProcedure } from "@/utils/middleware.ts";
import { createLink, updateLink } from "./links.ts";
import { CreateLinkSchema, UpdateLinkSchema } from "./schema.ts";

export default router({
  create: pageUpdateProcedure
    .input(CreateLinkSchema)
    .mutation(({ input, ctx }) => createLink(input, ctx)),

  update: pageUpdateProcedure
    .input(UpdateLinkSchema)
    .mutation(({ input, ctx }) => updateLink(input, ctx)),
});
